import { prisma } from "../banco/prisma.js";

async function criar(dados) {
  const {
    nome,
    data,
    local,
    tipoParticipante,
    categoria,
    quantidadeMaxima
  } = dados;

  const campeonato = await prisma.campeonato.create({
    data: {
      nome,
      data: data ? new Date(data) : null,
      local: local || null,
      tipoParticipante,
      categoria,
      quantidadeMaxima: quantidadeMaxima ? Number(quantidadeMaxima) : null
    }
  });

  return campeonato;
}

async function listar() {
  const campeonatos = await prisma.campeonato.findMany({
    orderBy: {
      criadoEm: "desc"
    }
  });

  return campeonatos;
}

async function buscarPorId(id) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      participantes: {
        include: {
          jogadores: true
        }
      },
      jogos: {
        include: {
          equipeA: true,
          equipeB: true,
          vencedor: true,
          sets: true
        }
      }
    }
  });

  return campeonato;
}

async function excluir(id) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(id)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  await prisma.campeonato.delete({
    where: {
      id: Number(id)
    }
  });

  return { mensagem: "Campeonato excluído com sucesso." };
}

export default {
  criar,
  listar,
  buscarPorId,
  excluir
};