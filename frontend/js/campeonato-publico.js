import { buscarResumoCampeonato } from "./api.js";

const params = new URLSearchParams(window.location.search);
const campeonatoId = params.get("id");

const dadosCampeonatoPublico = document.getElementById("dados-campeonato-publico");
const listaParticipantesPublico = document.getElementById("lista-participantes-publico");
const listaJogosPublico = document.getElementById("lista-jogos-publico");
const podioPublico = document.getElementById("podio-publico");
const mensagemCampeonatoPublico = document.getElementById("mensagem-campeonato-publico");

function formatarData(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function traduzirFase(fase) {
  const mapa = {
    SEMIFINAL_1: "Semifinal 1",
    SEMIFINAL_2: "Semifinal 2",
    FINAL: "Final",
    TERCEIRO_LUGAR: "3º Lugar",
    PRIMEIRA_FASE: "Primeira Fase"
  };

  return mapa[fase] || fase;
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

function renderizarResumo(resumo) {
  const campeonato = resumo.campeonato;
  const textoStatus = traduzirStatusCampeonato(resumo.statusCampeonato);
  const classeStatus = classeStatusCampeonato(resumo.statusCampeonato);

  dadosCampeonatoPublico.innerHTML = `
    <div class="bloco-informacoes">
      <p><strong>Nome:</strong> ${campeonato.nome}</p>
      <p><strong>Data:</strong> ${formatarData(campeonato.data)}</p>
      <p><strong>Local:</strong> ${campeonato.local || "Não informado"}</p>
      <p><strong>Tipo:</strong> ${campeonato.tipoParticipante}</p>
      <p><strong>Categoria:</strong> ${campeonato.categoria}</p>
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
              <p><strong>Responsável:</strong> ${participante.responsavel}</p>
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
    const resumo = await buscarResumoCampeonato(campeonatoId);

    renderizarResumo(resumo);
    renderizarParticipantes(resumo.participantes);
    renderizarJogos(resumo.jogos);
    renderizarPodio(resumo.podio);

    mensagemCampeonatoPublico.textContent = "";
  } catch (error) {
    mensagemCampeonatoPublico.textContent = `Erro ao carregar campeonato: ${error.message}`;
  }
}

carregarResumoPublico();