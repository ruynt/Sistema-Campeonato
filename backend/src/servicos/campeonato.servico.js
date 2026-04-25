import { prisma } from "../banco/prisma.js";

async function criar(dados) {
  const {
    nome,
    data,
    local,
    tipoParticipante,
    categoria,
    formato,
    quantidadeMaxima
  } = dados;

  const campeonato = await prisma.campeonato.create({
    data: {
      nome,
      data: data ? new Date(data) : null,
      local: local || null,
      tipoParticipante,
      categoria,
      formato: formato || "MATA_MATA",
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

async function listarPorOrganizador() {
  const campeonatos = await prisma.campeonato.findMany({
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
      formato: campeonato.formato,
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

async function atualizar(id, dados) {
  const {
    nome,
    data,
    local,
    tipoParticipante,
    categoria,
    formato,
    quantidadeMaxima
  } = dados;

  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      jogos: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("Não é permitido editar o campeonato após o chaveamento ter sido gerado.");
  }

  const totalInscritos = await prisma.participante.count({
    where: {
      campeonatoId: Number(id)
    }
  });

  if (
    quantidadeMaxima !== null &&
    quantidadeMaxima !== undefined &&
    quantidadeMaxima !== "" &&
    Number(quantidadeMaxima) < totalInscritos
  ) {
    throw new Error(
      `A quantidade máxima não pode ser menor que o total atual de inscritos (${totalInscritos}).`
    );
  }

  const campeonatoAtualizado = await prisma.campeonato.update({
    where: {
      id: Number(id)
    },
    data: {
      nome,
      data: data ? new Date(data) : null,
      local: local || null,
      tipoParticipante,
      categoria,
      formato: formato || "MATA_MATA",
      quantidadeMaxima: quantidadeMaxima ? Number(quantidadeMaxima) : null
    }
  });

  return campeonatoAtualizado;
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
  listarPorOrganizador,
  listarPublicos,
  buscarPorId,
  atualizar,
  excluir
};