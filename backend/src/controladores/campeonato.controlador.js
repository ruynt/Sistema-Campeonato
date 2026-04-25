import campeonatoServico from "../servicos/campeonato.servico.js";

async function criar(req, res) {
  try {
    const {
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      quantidadeMaxima
    } = req.body;

    if (!nome || !tipoParticipante || !categoria) {
      return res.status(400).json({
        erro: "Nome, tipoParticipante e categoria são obrigatórios."
      });
    }

    const tiposValidos = ["DUPLA", "TIME"];
    const categoriasValidas = ["MASCULINO", "FEMININO", "MISTA"];
    const formatosValidos = ["MATA_MATA", "DUPLA_ELIMINACAO", "TODOS_CONTRA_TODOS"];

    if (!tiposValidos.includes(tipoParticipante)) {
      return res.status(400).json({
        erro: "tipoParticipante inválido. Use DUPLA ou TIME."
      });
    }

    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        erro: "categoria inválida. Use MASCULINO, FEMININO ou MISTA."
      });
    }

    if (formato && !formatosValidos.includes(formato)) {
      return res.status(400).json({
        erro: "formato inválido. Use MATA_MATA, DUPLA_ELIMINACAO ou TODOS_CONTRA_TODOS."
      });
    }

    const campeonato = await campeonatoServico.criar({
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      quantidadeMaxima
    });

    return res.status(201).json(campeonato);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao criar campeonato.",
      detalhe: error.message
    });
  }
}

async function listar(req, res) {
  try {
    const campeonatos = await campeonatoServico.listar();
    return res.json(campeonatos);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar campeonatos.",
      detalhe: error.message
    });
  }
}

async function listarMeus(req, res) {
  try {
    const campeonatos = await campeonatoServico.listar();
    return res.json(campeonatos);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar campeonatos administrativos.",
      detalhe: error.message
    });
  }
}

async function listarPublicos(req, res) {
  try {
    const campeonatos = await campeonatoServico.listarPublicos();
    return res.json(campeonatos);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao listar campeonatos públicos.",
      detalhe: error.message
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const campeonato = await campeonatoServico.buscarPorId(id);

    if (!campeonato) {
      return res.status(404).json({
        erro: "Campeonato não encontrado."
      });
    }

    return res.json(campeonato);
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao buscar campeonato.",
      detalhe: error.message
    });
  }
}

async function excluir(req, res) {
  try {
    const { id } = req.params;

    const resultado = await campeonatoServico.excluir(id);

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const {
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      quantidadeMaxima
    } = req.body;

    if (!nome || !tipoParticipante || !categoria) {
      return res.status(400).json({
        erro: "Nome, tipoParticipante e categoria são obrigatórios."
      });
    }

    const tiposValidos = ["DUPLA", "TIME"];
    const categoriasValidas = ["MASCULINO", "FEMININO", "MISTA"];
    const formatosValidos = ["MATA_MATA", "DUPLA_ELIMINACAO", "TODOS_CONTRA_TODOS"];

    if (!tiposValidos.includes(tipoParticipante)) {
      return res.status(400).json({
        erro: "tipoParticipante inválido. Use DUPLA ou TIME."
      });
    }

    if (!categoriasValidas.includes(categoria)) {
      return res.status(400).json({
        erro: "categoria inválida. Use MASCULINO, FEMININO ou MISTA."
      });
    }

    if (formato && !formatosValidos.includes(formato)) {
      return res.status(400).json({
        erro: "formato inválido. Use MATA_MATA, DUPLA_ELIMINACAO ou TODOS_CONTRA_TODOS."
      });
    }

    const campeonato = await campeonatoServico.atualizar(id, {
      nome,
      data,
      local,
      tipoParticipante,
      categoria,
      formato,
      quantidadeMaxima
    });

    return res.json(campeonato);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  criar,
  listar,
  listarMeus,
  listarPublicos,
  buscarPorId,
  atualizar,
  excluir
};