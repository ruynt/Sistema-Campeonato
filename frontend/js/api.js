const URL_BASE = "http://localhost:3333";

function obterToken() {
  return localStorage.getItem("tokenAdmin");
}

function obterCabecalhos(headersExtras = {}, usarTokenAdmin = true) {
  const headers = {
    "Content-Type": "application/json",
    ...headersExtras
  };

  if (usarTokenAdmin) {
    const token = obterToken();

    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

async function fazerRequisicao(caminho, opcoes = {}) {
  const {
    headers,
    usarTokenAdmin = true,
    ...restoOpcoes
  } = opcoes;

  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    ...restoOpcoes,
    headers: obterCabecalhos(headers, usarTokenAdmin)
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || dados.detalhe || "Erro na requisição.");
  }

  return dados;
}

async function loginAdmin(dados) {
  return fazerRequisicao("/admin/login", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function cadastrarParticipante(dados) {
  return fazerRequisicao("/usuarios/cadastro", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function loginParticipante(dados) {
  return fazerRequisicao("/usuarios/login", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function listarMinhasInscricoes() {
  const tokenParticipante = localStorage.getItem("tokenParticipante");

  return fazerRequisicao("/usuarios/minhas-inscricoes", {
    method: "GET",
    headers: tokenParticipante
      ? { Authorization: `Bearer ${tokenParticipante}` }
      : {},
    usarTokenAdmin: false
  });
}

async function listarCampeonatos() {
  return fazerRequisicao("/campeonatos", {
    usarTokenAdmin: false
  });
}

async function criarCampeonato(dadosCampeonato) {
  return fazerRequisicao("/campeonatos", {
    method: "POST",
    body: JSON.stringify(dadosCampeonato)
  });
}

async function buscarResumoCampeonato(id) {
  return fazerRequisicao(`/campeonatos/${id}/resumo`);
}

async function buscarResumoCampeonatoPublico(id) {
  return fazerRequisicao(`/campeonatos/${id}/resumo-publico`, {
    usarTokenAdmin: false
  });
}

async function encerrarInscricoes(id) {
  return fazerRequisicao(`/campeonatos/${id}/encerrar-inscricoes`, {
    method: "PATCH"
  });
}

async function reabrirInscricoes(id) {
  return fazerRequisicao(`/campeonatos/${id}/reabrir-inscricoes`, {
    method: "PATCH"
  });
}

async function gerarChaveamento(id) {
  return fazerRequisicao(`/campeonatos/${id}/chaveamento`, {
    method: "POST"
  });
}

async function buscarCampeonatoPorId(id) {
  return fazerRequisicao(`/campeonatos/${id}`, {
    usarTokenAdmin: false
  });
}

async function criarInscricao(campeonatoId, dadosInscricao) {
  const tokenParticipante = localStorage.getItem("tokenParticipante");

  return fazerRequisicao(`/campeonatos/${campeonatoId}/inscricoes`, {
    method: "POST",
    headers: tokenParticipante
      ? { Authorization: `Bearer ${tokenParticipante}` }
      : {},
    body: JSON.stringify(dadosInscricao),
    usarTokenAdmin: false
  });
}

async function registrarPlacar(jogoId, sets) {
  return fazerRequisicao(`/jogos/${jogoId}/placar`, {
    method: "PATCH",
    body: JSON.stringify({ sets })
  });
}

async function excluirInscricao(inscricaoId) {
  return fazerRequisicao(`/campeonatos/inscricoes/${inscricaoId}`, {
    method: "DELETE"
  });
}

async function excluirCampeonato(campeonatoId) {
  return fazerRequisicao(`/campeonatos/${campeonatoId}`, {
    method: "DELETE"
  });
}

async function listarMeusCampeonatos() {
  return fazerRequisicao("/campeonatos/meus");
}

async function listarCampeonatosPublicos() {
  return fazerRequisicao("/campeonatos/publicos", {
    usarTokenAdmin: false
  });
}

async function atualizarCampeonato(campeonatoId, dadosCampeonato) {
  return fazerRequisicao(`/campeonatos/${campeonatoId}`, {
    method: "PUT",
    body: JSON.stringify(dadosCampeonato)
  });
}

async function atualizarInscricao(inscricaoId, dadosInscricao) {
  return fazerRequisicao(`/campeonatos/inscricoes/${inscricaoId}`, {
    method: "PUT",
    body: JSON.stringify(dadosInscricao)
  });
}

export {
  loginAdmin,
  cadastrarParticipante,
  loginParticipante,
  listarMinhasInscricoes,
  listarCampeonatos,
  listarMeusCampeonatos,
  listarCampeonatosPublicos,
  criarCampeonato,
  buscarResumoCampeonato,
  buscarResumoCampeonatoPublico,
  encerrarInscricoes,
  reabrirInscricoes,
  gerarChaveamento,
  buscarCampeonatoPorId,
  criarInscricao,
  registrarPlacar,
  excluirInscricao,
  excluirCampeonato,
  atualizarInscricao,
  atualizarCampeonato,
  obterToken
};