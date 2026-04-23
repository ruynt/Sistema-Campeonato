import { buscarCampeonatoPorId, criarInscricao } from "./api.js";

const params = new URLSearchParams(window.location.search);
const campeonatoId = params.get("id");

const dadosCampeonatoPublico = document.getElementById("dados-campeonato-publico");
const formInscricao = document.getElementById("form-inscricao");
const jogadoresContainer = document.getElementById("jogadores-container");
const mensagemInscricao = document.getElementById("mensagem-inscricao");

let campeonatoAtual = null;

function formatarData(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function renderizarCabecalhoCampeonato(campeonato) {
  dadosCampeonatoPublico.innerHTML = `
    <div class="bloco-informacoes">
      <p><strong>Nome:</strong> ${campeonato.nome}</p>
      <p><strong>Data:</strong> ${formatarData(campeonato.data)}</p>
      <p><strong>Local:</strong> ${campeonato.local || "Não informado"}</p>
      <p><strong>Tipo:</strong> ${campeonato.tipoParticipante}</p>
      <p><strong>Categoria:</strong> ${campeonato.categoria}</p>
      <p><strong>Inscrições abertas:</strong> ${campeonato.inscricoesAbertas ? "Sim" : "Não"}</p>
    </div>
  `;
}

function quantidadeJogadoresPorTipo(tipoParticipante) {
  return tipoParticipante === "DUPLA" ? 2 : 4;
}

function renderizarCamposJogadores(tipoParticipante) {
  const quantidade = quantidadeJogadoresPorTipo(tipoParticipante);

  jogadoresContainer.innerHTML = "";

  for (let i = 1; i <= quantidade; i++) {
    const card = document.createElement("div");
    card.className = "card-jogador";

    card.innerHTML = `
      <h3>Jogador ${i}</h3>
      <div class="formulario">
        <div class="grupo-formulario">
          <label for="jogador-nome-${i}">Nome</label>
          <input type="text" id="jogador-nome-${i}" name="jogador-nome-${i}" required />
        </div>

        <div class="grupo-formulario">
          <label for="jogador-genero-${i}">Gênero</label>
          <select id="jogador-genero-${i}" name="jogador-genero-${i}" required>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
          </select>
        </div>
      </div>
    `;

    jogadoresContainer.appendChild(card);
  }
}

function coletarJogadores() {
  const quantidade = quantidadeJogadoresPorTipo(campeonatoAtual.tipoParticipante);
  const jogadores = [];

  for (let i = 1; i <= quantidade; i++) {
    jogadores.push({
      nome: document.getElementById(`jogador-nome-${i}`).value.trim(),
      genero: document.getElementById(`jogador-genero-${i}`).value
    });
  }

  return jogadores;
}

async function carregarCampeonato() {
  if (!campeonatoId) {
    dadosCampeonatoPublico.innerHTML = "<p>ID do campeonato não informado.</p>";
    formInscricao.style.display = "none";
    return;
  }

  try {
    campeonatoAtual = await buscarCampeonatoPorId(campeonatoId);
    renderizarCabecalhoCampeonato(campeonatoAtual);
    renderizarCamposJogadores(campeonatoAtual.tipoParticipante);

    if (!campeonatoAtual.inscricoesAbertas) {
      mensagemInscricao.textContent = "As inscrições deste campeonato estão encerradas.";
      formInscricao.style.display = "none";
    }
  } catch (error) {
    dadosCampeonatoPublico.innerHTML = `<p>Erro ao carregar campeonato: ${error.message}</p>`;
    formInscricao.style.display = "none";
  }
}

formInscricao.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagemInscricao.textContent = "Enviando inscrição...";

  const formData = new FormData(formInscricao);

  const dadosInscricao = {
    nomeEquipe: formData.get("nomeEquipe"),
    responsavel: formData.get("responsavel"),
    contato: formData.get("contato") || null,
    jogadores: coletarJogadores()
  };

  try {
    await criarInscricao(campeonatoId, dadosInscricao);
    mensagemInscricao.textContent = "Inscrição enviada com sucesso.";
    formInscricao.reset();
    renderizarCamposJogadores(campeonatoAtual.tipoParticipante);
  } catch (error) {
    mensagemInscricao.textContent = `Erro ao enviar inscrição: ${error.message}`;
  }
});

carregarCampeonato();