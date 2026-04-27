import { buscarResumoCampeonatoPublico } from "./api.js";

const params = new URLSearchParams(window.location.search);
const campeonatoId = params.get("id");

const dadosCampeonatoPublico = document.getElementById("dados-campeonato-publico");
const listaParticipantesPublico = document.getElementById("lista-participantes-publico");
const chaveCampeonatoPublico = document.getElementById("chave-campeonato-publico");
const listaJogosPublico = document.getElementById("lista-jogos-publico");
const podioPublico = document.getElementById("podio-publico");
const mensagemCampeonatoPublico = document.getElementById("mensagem-campeonato-publico");
const participanteLogadoBox = document.getElementById("participante-logado-box");
const botaoLogoutParticipante = document.getElementById("botao-logout-participante");
const linkParticipante = document.getElementById("link-participante");
const linkMinhasInscricoes = document.getElementById("link-minhas-inscricoes");

function obterParticipanteLogado() {
  const dados = localStorage.getItem("participanteLogado");
  return dados ? JSON.parse(dados) : null;
}

function obterTokenParticipante() {
  return localStorage.getItem("tokenParticipante");
}

function configurarSessaoParticipante() {
  const participante = obterParticipanteLogado();
  const token = obterTokenParticipante();

  if (!participante || !token) {
    participanteLogadoBox.classList.add("oculto");
    botaoLogoutParticipante.classList.add("oculto");
    linkParticipante.classList.remove("oculto");
    linkMinhasInscricoes.classList.add("oculto");
    return;
  }

  participanteLogadoBox.innerHTML = `
    <p><strong>Participante logado:</strong> ${participante.nome}</p>
    <p><strong>E-mail:</strong> ${participante.email}</p>
  `;

  participanteLogadoBox.classList.remove("oculto");
  botaoLogoutParticipante.classList.remove("oculto");
  linkParticipante.classList.add("oculto");
  linkMinhasInscricoes.classList.remove("oculto");
}

function sairParticipante() {
  localStorage.removeItem("tokenParticipante");
  localStorage.removeItem("participanteLogado");
  window.location.href = "./campeonatos-publicos.html";
}

function formatarData(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function traduzirTipoParticipante(tipo) {
  const mapa = {
    DUPLA: "Dupla",
    TIME: "Quarteto"
  };

  return mapa[tipo] || tipo;
}

function traduzirFormato(formato) {
  const mapa = {
    MATA_MATA: "Mata-mata",
    DUPLA_ELIMINACAO: "Upper/Lower",
    TODOS_CONTRA_TODOS: "Todos contra todos"
  };

  return mapa[formato] || formato;
}

function traduzirFase(fase) {
  const mapa = {
    SEMIFINAL_1: "Semifinal 1",
    SEMIFINAL_2: "Semifinal 2",
    FINAL: "Final",
    TERCEIRO_LUGAR: "3º Lugar",
    PRIMEIRA_FASE_1: "Primeira fase 1",
    PRIMEIRA_FASE_2: "Primeira fase 2",
    PRIMEIRA_FASE_3: "Primeira fase 3",
    PRIMEIRA_FASE_4: "Primeira fase 4",
    QUARTAS_1: "Quartas 1",
    QUARTAS_2: "Quartas 2",
    QUARTAS_3: "Quartas 3",
    QUARTAS_4: "Quartas 4",
    OITAVAS_1: "Oitavas 1",
    OITAVAS_2: "Oitavas 2",
    OITAVAS_3: "Oitavas 3",
    OITAVAS_4: "Oitavas 4",
    OITAVAS_5: "Oitavas 5",
    OITAVAS_6: "Oitavas 6",
    OITAVAS_7: "Oitavas 7",
    OITAVAS_8: "Oitavas 8"
  };

  return mapa[fase] || fase.replaceAll("_", " ");
}

function traduzirStatusCampeonato(status) {
  const mapa = {
    INSCRICOES_ABERTAS: "Inscrições abertas",
    AGUARDANDO_CHAVEAMENTO: "Aguardando chaveamento",
    EM_ANDAMENTO: "Em andamento",
    FINALIZADO: "Finalizado"
  };

  return mapa[status] || status;
}

function classeStatusCampeonato(status) {
  const mapa = {
    INSCRICOES_ABERTAS: "status-inscricoes",
    AGUARDANDO_CHAVEAMENTO: "status-aguardando",
    EM_ANDAMENTO: "status-andamento",
    FINALIZADO: "status-finalizado"
  };

  return mapa[status] || "status-aguardando";
}

function obterBaseFase(fase) {
  if (fase === "FINAL") return "FINAL";
  if (fase === "TERCEIRO_LUGAR") return "TERCEIRO_LUGAR";
  if (fase.startsWith("PRIMEIRA_FASE")) return "PRIMEIRA_FASE";
  if (fase.startsWith("OITAVAS")) return "OITAVAS";
  if (fase.startsWith("QUARTAS")) return "QUARTAS";
  if (fase.startsWith("SEMIFINAL")) return "SEMIFINAL";

  const match = fase.match(/^(.*)_\d+$/);
  if (match) return match[1];

  return fase;
}

function obterTituloGrupoFase(baseFase) {
  const mapa = {
    PRIMEIRA_FASE: "Primeira fase",
    OITAVAS: "Oitavas",
    QUARTAS: "Quartas de final",
    SEMIFINAL: "Semifinais",
    FINAL: "Final",
    TERCEIRO_LUGAR: "3º Lugar"
  };

  return mapa[baseFase] || baseFase.replaceAll("_", " ");
}

function renderizarResumo(resumo) {
  const campeonato = resumo.campeonato;
  const textoStatus = traduzirStatusCampeonato(resumo.statusCampeonato);
  const classeStatus = classeStatusCampeonato(resumo.statusCampeonato);

  dadosCampeonatoPublico.innerHTML = `
    <div class="bloco-informacoes">
      <p><strong>Nome:</strong> ${campeonato.nome}</p>
      <p><strong>Data:</strong> ${formatarData(campeonato.data)}</p>
      <p><strong>Local:</strong> ${campeonato.local || "Não informado"}</p>
      <p><strong>Tipo:</strong> ${traduzirTipoParticipante(campeonato.tipoParticipante)}</p>
      <p><strong>Categoria:</strong> ${campeonato.categoria}</p>
      <p><strong>Formato:</strong> ${traduzirFormato(campeonato.formato)}</p>
      <p><strong>Total de participantes:</strong> ${resumo.totais.participantes}</p>
      <p><strong>Total de jogos:</strong> ${resumo.totais.jogos}</p>
      <p><strong>Jogos finalizados:</strong> ${resumo.totais.jogosFinalizados}</p>
      <span class="status-badge ${classeStatus}">${textoStatus}</span>

      ${
        campeonato.inscricoesAbertas
          ? `
            <div class="acoes-card">
              <a class="botao" href="./inscricao.html?id=${campeonato.id}">
                Participar deste campeonato
              </a>
            </div>
          `
          : `
            <p class="info-auxiliar">As inscrições deste campeonato estão encerradas.</p>
          `
      }
    </div>
  `;
}

function renderizarParticipantes(participantes) {
  if (!participantes.length) {
    listaParticipantesPublico.innerHTML = "<p>Nenhum participante inscrito ainda.</p>";
    return;
  }

  listaParticipantesPublico.innerHTML = `
    <div class="lista-simples">
      ${participantes
        .map(
          (participante) => `
            <div class="item-lista">
              <h3>${participante.nomeEquipe}</h3>
              <p><strong>Capitã(o):</strong> ${participante.responsavel}</p>
              <ul>
                ${participante.jogadores
                  .map((jogador) => `<li>${jogador.nome} (${jogador.genero})</li>`)
                  .join("")}
              </ul>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function agruparJogosPorColunaMataMata(jogos) {
  const grupos = new Map();

  jogos.forEach((jogo) => {
    const baseFase = obterBaseFase(jogo.fase);

    if (!grupos.has(baseFase)) {
      grupos.set(baseFase, []);
    }

    grupos.get(baseFase).push(jogo);
  });

  const ordem = [
    "PRIMEIRA_FASE",
    "OITAVAS",
    "QUARTAS",
    "SEMIFINAL",
    "FINAL",
    "TERCEIRO_LUGAR"
  ];

  return Array.from(grupos.entries()).sort((a, b) => {
    const indiceA = ordem.indexOf(a[0]);
    const indiceB = ordem.indexOf(b[0]);

    const valorA = indiceA === -1 ? 999 : indiceA;
    const valorB = indiceB === -1 ? 999 : indiceB;

    return valorA - valorB;
  });
}

function renderizarChaveMataMata(jogos) {
  const colunas = agruparJogosPorColunaMataMata(jogos);

  if (!colunas.length) {
    chaveCampeonatoPublico.innerHTML = "<p>Nenhum jogo gerado ainda.</p>";
    return;
  }

  chaveCampeonatoPublico.innerHTML = `
    <div class="chave-grid">
      ${colunas
        .map(
          ([baseFase, lista]) => `
            <div class="coluna-chave">
              <h3>${obterTituloGrupoFase(baseFase)}</h3>
              ${lista
                .map((jogo) => {
                  const equipeA = jogo.equipeA?.nomeEquipe || "A definir";
                  const equipeB = jogo.equipeB?.nomeEquipe || "A definir";
                  const vencedorId = jogo.vencedorId;

                  return `
                    <div class="jogo-chave">
                      <div class="fase-status">${jogo.status}</div>

                      <div class="linha-equipe ${
                        jogo.equipeAId && vencedorId === jogo.equipeAId
                          ? "vencedor-chave"
                          : ""
                      }">
                        ${equipeA}
                      </div>

                      <div class="linha-equipe ${
                        jogo.equipeBId && vencedorId === jogo.equipeBId
                          ? "vencedor-chave"
                          : ""
                      }">
                        ${equipeB}
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderizarChave(resumo) {
  if (resumo.campeonato.formato !== "MATA_MATA") {
    chaveCampeonatoPublico.innerHTML =
      "<p>A visualização de chave para este formato será adicionada em breve.</p>";
    return;
  }

  renderizarChaveMataMata(resumo.jogos);
}

function renderizarJogos(jogos) {
  if (!jogos.length) {
    listaJogosPublico.innerHTML = "<p>Nenhum jogo gerado ainda.</p>";
    return;
  }

  listaJogosPublico.innerHTML = `
    <div class="lista-simples">
      ${jogos
        .map((jogo) => {
          const nomeEquipeA = jogo.equipeA?.nomeEquipe || "A definir";
          const nomeEquipeB = jogo.equipeB?.nomeEquipe || "A definir";
          const nomeVencedor = jogo.vencedor?.nomeEquipe || "Ainda não definido";

          return `
            <div class="item-lista">
              <h3>${traduzirFase(jogo.fase)}</h3>
              <p><strong>Status:</strong> ${jogo.status}</p>

              <div class="confronto-visual">
                <div class="equipe-box">${nomeEquipeA}</div>
                <div class="vs-box">VS</div>
                <div class="equipe-box">${nomeEquipeB}</div>
              </div>

              <p><strong>Vencedor:</strong> ${nomeVencedor}</p>

              <div>
                <strong>Sets:</strong>
                ${
                  jogo.sets.length
                    ? `
                      <ul>
                        ${jogo.sets
                          .map(
                            (set) =>
                              `<li>Set ${set.numeroSet}: ${set.pontosA} x ${set.pontosB}</li>`
                          )
                          .join("")}
                      </ul>
                    `
                    : "<p>Nenhum set registrado.</p>"
                }
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderizarPodio(dadosPodio) {
  if (!dadosPodio) {
    podioPublico.innerHTML = "<p>Pódio ainda não definido.</p>";
    return;
  }

  podioPublico.innerHTML = `
    <div class="podio-grid">
      <div class="card-podio">
        <h3>🥇 1º Lugar</h3>
        <p>${dadosPodio.primeiroLugar?.nomeEquipe || "—"}</p>
      </div>
      <div class="card-podio">
        <h3>🥈 2º Lugar</h3>
        <p>${dadosPodio.segundoLugar?.nomeEquipe || "—"}</p>
      </div>
      <div class="card-podio">
        <h3>🥉 3º Lugar</h3>
        <p>${dadosPodio.terceiroLugar?.nomeEquipe || "—"}</p>
      </div>
    </div>
  `;
}

async function carregarResumoPublico() {
  if (!campeonatoId) {
    mensagemCampeonatoPublico.textContent = "ID do campeonato não informado.";
    return;
  }

  try {
    mensagemCampeonatoPublico.textContent = "Carregando campeonato...";
    const resumo = await buscarResumoCampeonatoPublico(campeonatoId);

    renderizarResumo(resumo);
    renderizarParticipantes(resumo.participantes);
    renderizarChave(resumo);
    renderizarJogos(resumo.jogos);
    renderizarPodio(resumo.podio);

    mensagemCampeonatoPublico.textContent = "";
  } catch (error) {
    mensagemCampeonatoPublico.textContent = `Erro ao carregar campeonato: ${error.message}`;
  }
}

botaoLogoutParticipante.addEventListener("click", sairParticipante);

configurarSessaoParticipante();
carregarResumoPublico();