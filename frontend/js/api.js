const URL_BASE = "http://localhost:3333";

async function fazerRequisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_BASE}${caminho}`, {
    headers: {
      "Content-Type": "application/json",
      ...(opcoes.headers || {})
    },
    ...opcoes
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(dados.erro || "Erro na requisição.");
  }

  return dados;
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

export {
  listarCampeonatos,
  criarCampeonato,
  buscarResumoCampeonato,
  encerrarInscricoes,
  gerarChaveamento,
  buscarCampeonatoPorId,
  criarInscricao,
  registrarPlacar,
  excluirInscricao,
  excluirCampeonato
};