import { prisma } from "../banco/prisma.js";
import { embaralharLista } from "../utilitarios/sorteio.js";

async function encerrarInscricoes(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const campeonatoAtualizado = await prisma.campeonato.update({
    where: {
      id: Number(campeonatoId)
    },
    data: {
      inscricoesAbertas: false
    }
  });

  return campeonatoAtualizado;
}

async function gerarChaveamento(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: {
        where: {
          statusInscricao: "APROVADA"
        }
      },
      jogos: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.inscricoesAbertas) {
    throw new Error("Feche as inscrições antes de gerar o chaveamento.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("O chaveamento deste campeonato já foi gerado.");
  }

  const participantes = campeonato.participantes;

  if (participantes.length < 2) {
    throw new Error("É preciso ter pelo menos 2 participantes para gerar o chaveamento.");
  }

  const participantesEmbaralhados = embaralharLista(participantes);

  if (participantes.length === 2) {
    await prisma.jogo.create({
      data: {
        fase: "FINAL",
        campeonatoId: Number(campeonatoId),
        equipeAId: participantesEmbaralhados[0].id,
        equipeBId: participantesEmbaralhados[1].id
      }
    });
  } else if (participantes.length === 4) {
    await prisma.jogo.createMany({
      data: [
        {
          fase: "SEMIFINAL_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: participantesEmbaralhados[0].id,
          equipeBId: participantesEmbaralhados[1].id
        },
        {
          fase: "SEMIFINAL_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: participantesEmbaralhados[2].id,
          equipeBId: participantesEmbaralhados[3].id
        }
      ]
    });
  } else {
    throw new Error("Nesta versão, o chaveamento suporta apenas 2 ou 4 participantes.");
  }

  return await listarJogos(campeonatoId);
}

async function listarJogos(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const jogos = await prisma.jogo.findMany({
    where: {
      campeonatoId: Number(campeonatoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true,
      sets: true
    },
    orderBy: {
      id: "asc"
    }
  });

  return jogos;
}

async function gerarProximaFaseSePossivel(campeonatoId) {
  const jogos = await prisma.jogo.findMany({
    where: {
      campeonatoId: Number(campeonatoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true
    },
    orderBy: {
      id: "asc"
    }
  });

  const semifinais = jogos.filter(
    (jogo) =>
      jogo.fase === "SEMIFINAL_1" || jogo.fase === "SEMIFINAL_2"
  );

  const finalExistente = jogos.find((jogo) => jogo.fase === "FINAL");
  const terceiroExistente = jogos.find((jogo) => jogo.fase === "TERCEIRO_LUGAR");

  const semifinaisFinalizadas =
    semifinais.length === 2 &&
    semifinais.every((jogo) => jogo.status === "FINALIZADO" && jogo.vencedorId);

  if (semifinaisFinalizadas && !finalExistente && !terceiroExistente) {
    const semifinal1 = semifinais.find((jogo) => jogo.fase === "SEMIFINAL_1");
    const semifinal2 = semifinais.find((jogo) => jogo.fase === "SEMIFINAL_2");

    const vencedor1 = semifinal1.vencedor;
    const vencedor2 = semifinal2.vencedor;

    const perdedor1 =
      semifinal1.equipeAId === vencedor1.id ? semifinal1.equipeB : semifinal1.equipeA;

    const perdedor2 =
      semifinal2.equipeAId === vencedor2.id ? semifinal2.equipeB : semifinal2.equipeA;

    await prisma.jogo.createMany({
      data: [
        {
          fase: "FINAL",
          campeonatoId: Number(campeonatoId),
          equipeAId: vencedor1.id,
          equipeBId: vencedor2.id
        },
        {
          fase: "TERCEIRO_LUGAR",
          campeonatoId: Number(campeonatoId),
          equipeAId: perdedor1.id,
          equipeBId: perdedor2.id
        }
      ]
    });
  }

  return await listarJogos(campeonatoId);
}

async function reabrirInscricoes(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      jogos: true
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  if (campeonato.jogos.length > 0) {
    throw new Error("Não é permitido reabrir inscrições após o chaveamento ter sido gerado.");
  }

  if (campeonato.inscricoesAbertas) {
    throw new Error("As inscrições já estão abertas.");
  }

  const campeonatoAtualizado = await prisma.campeonato.update({
    where: {
      id: Number(campeonatoId)
    },
    data: {
      inscricoesAbertas: true
    }
  });

  return campeonatoAtualizado;
}

export default {
  encerrarInscricoes,
  gerarChaveamento,
  listarJogos,
  reabrirInscricoes,
  gerarProximaFaseSePossivel
};