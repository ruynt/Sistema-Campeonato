import { prisma } from "../banco/prisma.js";

async function criar(dados) {
  const {
    nome,
    data,
    local,
    tipoParticipante,
    categoria,
    quantidadeMaxima,
    organizadorId
  } = dados;

  const campeonato = await prisma.campeonato.create({
    data: {
      nome,
      data: data ? new Date(data) : null,
      local: local || null,
      tipoParticipante,
      categoria,
      quantidadeMaxima: quantidadeMaxima ? Number(quantidadeMaxima) : null,
      organizadorId
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

async function listarPorOrganizador(organizadorId) {
  const campeonatos = await prisma.campeonato.findMany({
    where: {
      organizadorId: Number(organizadorId)
    },
    orderBy: {
      criadoEm: "desc"
    }
  });

  return campeonatos;
}

async function listarPublicos() {
  const campeonatos = await prisma.campeonato.findMany({
    include: {
      participantes: true,
      jogos: {
        include: {
          vencedor: true
        }
      }
    },
    orderBy: {
      criadoEm: "desc"
    }
  });

  return campeonatos.map((campeonato) => {
    const totalParticipantes = campeonato.participantes.length;
    const totalJogos = campeonato.jogos.length;
    const jogosFinalizados = campeonato.jogos.filter(
      (jogo) => jogo.status === "FINALIZADO"
    ).length;

    const finalFinalizada = campeonato.jogos.find(
      (jogo) =>
        jogo.fase === "FINAL" &&
        jogo.status === "FINALIZADO" &&
        jogo.vencedor
    );

    let statusCampeonato = "INSCRICOES_ABERTAS";

    if (!campeonato.inscricoesAbertas && totalJogos === 0) {
      statusCampeonato = "AGUARDANDO_CHAVEAMENTO";
    }

    if (totalJogos > 0 && !finalFinalizada) {
      statusCampeonato = "EM_ANDAMENTO";
    }

    if (finalFinalizada) {
      statusCampeonato = "FINALIZADO";
    }

    return {
      id: campeonato.id,
      nome: campeonato.nome,
      data: campeonato.data,
      local: campeonato.local,
      tipoParticipante: campeonato.tipoParticipante,
      categoria: campeonato.categoria,
      quantidadeMaxima: campeonato.quantidadeMaxima,
      inscricoesAbertas: campeonato.inscricoesAbertas,
      criadoEm: campeonato.criadoEm,
      totais: {
        participantes: totalParticipantes,
        jogos: totalJogos,
        jogosFinalizados
      },
      statusCampeonato
    };
  });
}

export default {
  criar,
  listar,
  listarPorOrganizador,
  listarPublicos,
  buscarPorId,
  excluir
};