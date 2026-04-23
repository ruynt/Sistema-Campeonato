import { prisma } from "../banco/prisma.js";
import { validarJogadoresPorCategoria } from "../utilitarios/validacoes.js";

async function inscrever(campeonatoId, dados) {
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
  excluir
};