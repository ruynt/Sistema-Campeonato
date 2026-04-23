const URL_BASE = "http://localhost:3333";

function obterToken() {
  return localStorage.getItem("tokenOrganizador");
}

function obterCabecalhos(opcoes = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(opcoes.headers || {})
  };

  const token = obterToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fazerRequisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    headers: obterCabecalhos(opcoes),
    ...opcoes
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || dados.detalhe || "Erro na requisição.");
  }

  return dados;
}

async function cadastrarOrganizador(dados) {
  return fazerRequisicao("/auth/cadastro", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function loginOrganizador(dados) {
  return fazerRequisicao("/auth/login", {
    method: "POST",
    body: JSON.stringify(dados)
  });
}

async function listarCampeonatos() {
  return fazerRequisicao("/campeonatos");
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

async function encerrarInscricoes(id) {
  return fazerRequisicao(`/campeonatos/${id}/encerrar-inscricoes`, {
    method: "PATCH"
  });
}

async function gerarChaveamento(id) {
  return fazerRequisicao(`/campeonatos/${id}/chaveamento`, {
    method: "POST"
  });
}

async function buscarCampeonatoPorId(id) {
  return fazerRequisicao(`/campeonatos/${id}`);
}

async function criarInscricao(campeonatoId, dadosInscricao) {
  return fazerRequisicao(`/campeonatos/${campeonatoId}/inscricoes`, {
    method: "POST",
    body: JSON.stringify(dadosInscricao)
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
  return fazerRequisicao("/campeonatos/publicos");
}

export {
  cadastrarOrganizador,
  loginOrganizador,
  listarCampeonatos,
  listarMeusCampeonatos,
  listarCampeonatosPublicos,
  criarCampeonato,
  buscarResumoCampeonato,
  encerrarInscricoes,
  gerarChaveamento,
  buscarCampeonatoPorId,
  criarInscricao,
  registrarPlacar,
  excluirInscricao,
  excluirCampeonato,
  obterToken
};