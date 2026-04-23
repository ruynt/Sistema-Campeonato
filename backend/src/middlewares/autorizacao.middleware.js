import { prisma } from "../banco/prisma.js";

async function verificarDonoCampeonato(req, res, next) {
  try {
    const campeonatoId = Number(req.params.id);

    if (!campeonatoId) {
      return res.status(400).json({
        erro: "ID do campeonato inválido."
      });
    }

    const campeonato = await prisma.campeonato.findUnique({
      where: {
        id: campeonatoId
      }
    });

    if (!campeonato) {
      return res.status(404).json({
        erro: "Campeonato não encontrado."
      });
    }

    if (campeonato.organizadorId !== req.organizador.id) {
      return res.status(403).json({
        erro: "Você não tem permissão para gerenciar este campeonato."
      });
    }

    req.campeonato = campeonato;
    next();
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao verificar permissão.",
      detalhe: error.message
    });
  }
}

async function verificarDonoPorInscricao(req, res, next) {
  try {
    const inscricaoId = Number(req.params.id);

    if (!inscricaoId) {
      return res.status(400).json({
        erro: "ID da inscrição inválido."
      });
    }

    const inscricao = await prisma.participante.findUnique({
      where: {
        id: inscricaoId
      },
      include: {
        campeonato: true
      }
    });

    if (!inscricao) {
      return res.status(404).json({
        erro: "Inscrição não encontrada."
      });
    }

    if (inscricao.campeonato.organizadorId !== req.organizador.id) {
      return res.status(403).json({
        erro: "Você não tem permissão para gerenciar esta inscrição."
      });
    }

    req.inscricao = inscricao;
    next();
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao verificar permissão.",
      detalhe: error.message
    });
  }
}

async function verificarDonoPorJogo(req, res, next) {
  try {
    const jogoId = Number(req.params.id);

    if (!jogoId) {
      return res.status(400).json({
        erro: "ID do jogo inválido."
      });
    }

    const jogo = await prisma.jogo.findUnique({
      where: {
        id: jogoId
      },
      include: {
        campeonato: true
      }
    });

    if (!jogo) {
      return res.status(404).json({
        erro: "Jogo não encontrado."
      });
    }

    if (jogo.campeonato.organizadorId !== req.organizador.id) {
      return res.status(403).json({
        erro: "Você não tem permissão para gerenciar este jogo."
      });
    }

    req.jogo = jogo;
    next();
  } catch (error) {
    return res.status(500).json({
      erro: "Erro ao verificar permissão.",
      detalhe: error.message
    });
  }
}

export {
  verificarDonoCampeonato,
  verificarDonoPorInscricao,
  verificarDonoPorJogo
};