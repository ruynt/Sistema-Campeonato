import {
  listarMeusCampeonatos,
  criarCampeonato,
  excluirCampeonato,
  buscarResumoCampeonato,
  obterToken
} from "./api.js";

const formCampeonato = document.getElementById("form-campeonato");
const mensagem = document.getElementById("mensagem");
const listaCampeonatos = document.getElementById("lista-campeonatos");
const botaoAtualizar = document.getElementById("botao-atualizar");
const buscaCampeonato = document.getElementById("busca-campeonato");
const filtroStatus = document.getElementById("filtro-status");
const usuarioLogadoBox = document.getElementById("usuario-logado-box");
const botaoLogout = document.getElementById("botao-logout");
const linkLogin = document.getElementById("link-login");

let campeonatosComResumo = [];

function obterOrganizadorLogado() {
  const dados = localStorage.getItem("organizadorLogado");
  return dados ? JSON.parse(dados) : null;
}

function estaAutenticado() {
  return Boolean(obterToken());
}

function sair() {
  localStorage.removeItem("tokenOrganizador");
  localStorage.removeItem("organizadorLogado");
  window.location.href = "./login.html";
}

function protegerPagina() {
  if (!estaAutenticado()) {
    window.location.href = "./login.html";
  }
}

function configurarSessao() {
  const organizador = obterOrganizadorLogado();

  if (!organizador) {
    usuarioLogadoBox.innerHTML = "<p>Nenhum organizador autenticado.</p>";
    return;
  }

  usuarioLogadoBox.innerHTML = `
    <p><strong>Organizador logado:</strong> ${organizador.nome}</p>
    <p><strong>E-mail:</strong> ${organizador.email}</p>
  `;

  linkLogin.style.display = "none";
}

function formatarTexto(valor) {
  return valor || "Não informado";
}

function formatarData(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function traduzirStatus(status) {
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

function aplicarFiltros(campeonatos) {
  const textoBusca = buscaCampeonato.value.trim().toLowerCase();
  const statusSelecionado = filtroStatus.value;

  return campeonatos.filter((item) => {
    const nomeCombina = item.nome.toLowerCase().includes(textoBusca);
    const statusCombina =
      statusSelecionado === "TODOS" ||
      item.statusCampeonato === statusSelecionado;

    return nomeCombina && statusCombina;
  });
}

function renderizarCampeonatos(campeonatos) {
  if (!campeonatos.length) {
    listaCampeonatos.innerHTML =
      "<p>Nenhum campeonato encontrado com os filtros atuais.</p>";
    return;
  }

  listaCampeonatos.innerHTML = campeonatos
    .map((campeonato) => {
      const textoStatus = traduzirStatus(campeonato.statusCampeonato);
      const classeStatus = classeStatusCampeonato(campeonato.statusCampeonato);

      return `
        <div class="item-campeonato">
          <h3>${campeonato.nome}</h3>
          <p><strong>ID:</strong> ${campeonato.id}</p>
          <p><strong>Data:</strong> ${formatarData(campeonato.data)}</p>
          <p><strong>Local:</strong> ${formatarTexto(campeonato.local)}</p>
          <p><strong>Tipo:</strong> ${campeonato.tipoParticipante}</p>
          <p><strong>Categoria:</strong> ${campeonato.categoria}</p>
          <p><strong>Quantidade máxima:</strong> ${
            campeonato.quantidadeMaxima ?? "Não definida"
          }</p>
          <p><strong>Inscrições abertas:</strong> ${
            campeonato.inscricoesAbertas ? "Sim" : "Não"
          }</p>

          <span class="badge-lista status-badge ${classeStatus}">
            ${textoStatus}
          </span>

          <div class="acoes-card">
            <a href="./campeonato.html?id=${campeonato.id}">Abrir campeonato</a>
            <a href="./inscricao.html?id=${campeonato.id}">Página de inscrição</a>
            <button
              class="botao-pequeno botao-excluir botao-excluir-campeonato"
              data-campeonato-id="${campeonato.id}"
            >
              Excluir campeonato
            </button>
          </div>
        </div>
      `;
    })
    .join("");

  conectarEventosExclusaoCampeonato();
}

async function carregarCampeonatos() {
  try {
    listaCampeonatos.innerHTML = "<p>Carregando campeonatos...</p>";

    const campeonatos = await listarMeusCampeonatos();

    const resumos = await Promise.all(
      campeonatos.map(async (campeonato) => {
        try {
          const resumo = await buscarResumoCampeonato(campeonato.id);
          return {
            ...campeonato,
            statusCampeonato: resumo.statusCampeonato
          };
        } catch {
          return {
            ...campeonato,
            statusCampeonato: campeonato.inscricoesAbertas
              ? "INSCRICOES_ABERTAS"
              : "AGUARDANDO_CHAVEAMENTO"
          };
        }
      })
    );

    campeonatosComResumo = resumos;
    atualizarListaComFiltros();
  } catch (error) {
    listaCampeonatos.innerHTML = `<p>Erro ao carregar campeonatos: ${error.message}</p>`;
  }
}

function atualizarListaComFiltros() {
  const campeonatosFiltrados = aplicarFiltros(campeonatosComResumo);
  renderizarCampeonatos(campeonatosFiltrados);
}

function conectarEventosExclusaoCampeonato() {
  const botoes = document.querySelectorAll("[data-campeonato-id]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", async () => {
      const campeonatoId = botao.dataset.campeonatoId;
      const confirmar = window.confirm(
        "Tem certeza que deseja excluir este campeonato?"
      );

      if (!confirmar) {
        return;
      }

      try {
        mensagem.textContent = "Excluindo campeonato...";
        await excluirCampeonato(campeonatoId);
        mensagem.textContent = "Campeonato excluído com sucesso.";
        await carregarCampeonatos();
      } catch (error) {
        mensagem.textContent = `Erro ao excluir campeonato: ${error.message}`;
      }
    });
  });
}

formCampeonato.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagem.textContent = "Criando campeonato...";

  const formData = new FormData(formCampeonato);

  const dadosCampeonato = {
    nome: formData.get("nome"),
    data: formData.get("data") || null,
    local: formData.get("local") || null,
    tipoParticipante: formData.get("tipoParticipante"),
    categoria: formData.get("categoria"),
    quantidadeMaxima: formData.get("quantidadeMaxima")
      ? Number(formData.get("quantidadeMaxima"))
      : null
  };

  try {
    await criarCampeonato(dadosCampeonato);
    mensagem.textContent = "Campeonato criado com sucesso.";
    formCampeonato.reset();
    await carregarCampeonatos();
  } catch (error) {
    mensagem.textContent = `Erro ao criar campeonato: ${error.message}`;
  }
});

botaoAtualizar.addEventListener("click", carregarCampeonatos);
buscaCampeonato.addEventListener("input", atualizarListaComFiltros);
filtroStatus.addEventListener("change", atualizarListaComFiltros);
botaoLogout.addEventListener("click", sair);

protegerPagina();
configurarSessao();
carregarCampeonatos();