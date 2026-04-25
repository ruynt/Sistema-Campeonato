import { prisma } from "../banco/prisma.js";
import { validarJogadoresPorCategoria } from "../utilitarios/validacoes.js";

async function inscrever(campeonatoId, dados, usuarioId = null) {
  const { nomeEquipe, responsavel, contato, jogadores } = dados;

  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (!campeonato.inscricoesAbertas) {
    throw new Error("As inscrições deste campeonato estão encerradas.");
  }

  if (usuarioId) {
    const inscricaoDoMesmoUsuario = await prisma.participante.findFirst({
      where: {
        campeonatoId: Number(campeonatoId),
        usuarioId: Number(usuarioId)
      }
    });

    if (inscricaoDoMesmoUsuario) {
      throw new Error("Você já realizou uma inscrição neste campeonato.");
    }
  }

  if (campeonato.quantidadeMaxima !== null) {
    const quantidadeAtual = campeonato.participantes.length;

    if (quantidadeAtual >= campeonato.quantidadeMaxima) {
      throw new Error("O limite máximo de inscrições já foi atingido.");
    }
  }

  const equipeExistente = await prisma.participante.findFirst({
    where: {
      campeonatoId: Number(campeonatoId),
      nomeEquipe: nomeEquipe
    }
  });

  if (equipeExistente) {
    throw new Error("Já existe uma equipe com esse nome neste campeonato.");
  }

  const erroValidacao = validarJogadoresPorCategoria(
    campeonato.tipoParticipante,
    campeonato.categoria,
    jogadores
  );

  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  const participante = await prisma.participante.create({
    data: {
      nomeEquipe,
      responsavel,
      contato: contato || null,
      campeonatoId: Number(campeonatoId),
      usuarioId,
      statusInscricao: "APROVADA",
      jogadores: {
        create: jogadores.map((jogador) => ({
          nome: jogador.nome,
          genero: jogador.genero
        }))
      }
    },
    include: {
      jogadores: true
    }
  });

  return participante;
}

async function atualizar(inscricaoId, dados) {
  const { nomeEquipe, responsavel, contato, jogadores } = dados;

  const participante = await prisma.participante.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      campeonato: {
        include: {
          jogos: true
        }
      }
    }
  });

  if (!participante) {
    throw new Error("Inscrição não encontrada.");
  }

  if (participante.campeonato.jogos.length > 0) {
    throw new Error("Não é permitido editar inscrição após o chaveamento ter sido gerado.");
  }

  const equipeExistente = await prisma.participante.findFirst({
    where: {
      campeonatoId: participante.campeonatoId,
      nomeEquipe,
      id: {
        not: Number(inscricaoId)
      }
    }
  });

  if (equipeExistente) {
    throw new Error("Já existe uma equipe com esse nome neste campeonato.");
  }

  const erroValidacao = validarJogadoresPorCategoria(
    participante.campeonato.tipoParticipante,
    participante.campeonato.categoria,
    jogadores
  );

  if (erroValidacao) {
    throw new Error(erroValidacao);
  }

  await prisma.$transaction(async (tx) => {
    await tx.jogador.deleteMany({
      where: {
        participanteId: Number(inscricaoId)
      }
    });

    await tx.participante.update({
      where: {
        id: Number(inscricaoId)
      },
      data: {
        nomeEquipe,
        responsavel,
        contato: contato || null
      }
    });

    await tx.jogador.createMany({
      data: jogadores.map((jogador) => ({
        nome: jogador.nome,
        genero: jogador.genero,
        participanteId: Number(inscricaoId)
      }))
    });
  });

  const inscricaoAtualizada = await prisma.participante.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      jogadores: true
    }
  });

  return inscricaoAtualizada;
}

async function listarPorCampeonato(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const participantes = await prisma.participante.findMany({
    where: {
      campeonatoId: Number(campeonatoId)
    },
    include: {
      jogadores: true
    },
    orderBy: {
      criadoEm: "asc"
    }
  });

  return participantes;
}

async function excluir(inscricaoId) {
  const participante = await prisma.participante.findUnique({
    where: {
      id: Number(inscricaoId)
    },
    include: {
      campeonato: {
        include: {
          jogos: true
        }
      }
    }
  });

  if (!participante) {
    throw new Error("Inscrição não encontrada.");
  }

  if (participante.campeonato.jogos.length > 0) {
    throw new Error("Não é permitido excluir inscrição após o chaveamento ter sido gerado.");
  }

  await prisma.participante.delete({
    where: {
      id: Number(inscricaoId)
    }
  });

  return { mensagem: "Inscrição excluída com sucesso." };
}

export default {
  inscrever,
  listarPorCampeonato,
  atualizar,
  excluir
};