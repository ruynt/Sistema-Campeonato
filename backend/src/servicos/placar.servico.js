import { prisma } from "../banco/prisma.js";
import chaveamentoServico from "./chaveamento.servico.js";

async function registrarPlacar(jogoId, setsInformados) {
  const jogo = await prisma.jogo.findUnique({
    where: {
      id: Number(jogoId)
    },
    include: {
      sets: true,
      equipeA: true,
      equipeB: true
    }
  });

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  if (!jogo.equipeAId || !jogo.equipeBId) {
    throw new Error("O jogo precisa ter duas equipes definidas.");
  }

  if (!Array.isArray(setsInformados) || setsInformados.length === 0) {
    throw new Error("Informe ao menos um set para registrar o placar.");
  }

  if (jogo.status === "FINALIZADO") {
    throw new Error("Este jogo já foi finalizado.");
  }

  const setsValidos = setsInformados.every((set) => {
    const numeroValido = typeof set.numeroSet === "number";
    const pontosAValidos = typeof set.pontosA === "number" && set.pontosA >= 0;
    const pontosBValidos = typeof set.pontosB === "number" && set.pontosB >= 0;
    const setsDiferentes = set.pontosA !== set.pontosB;

    return numeroValido && pontosAValidos && pontosBValidos && setsDiferentes;
  });

  if (!setsValidos) {
    throw new Error("Cada set precisa ter numeroSet, pontosA e pontosB válidos, sem empate.");
  }

  let vitoriasEquipeA = 0;
  let vitoriasEquipeB = 0;

  for (const set of setsInformados) {
    if (set.pontosA > set.pontosB) {
      vitoriasEquipeA += 1;
    } else {
      vitoriasEquipeB += 1;
    }
  }

  if (vitoriasEquipeA === vitoriasEquipeB) {
    throw new Error("O jogo não pode terminar empatado em número de sets.");
  }

  const vencedorId = vitoriasEquipeA > vitoriasEquipeB ? jogo.equipeAId : jogo.equipeBId;

  await prisma.$transaction(async (tx) => {
    await tx.setJogo.deleteMany({
      where: {
        jogoId: Number(jogoId)
      }
    });

    await tx.setJogo.createMany({
      data: setsInformados.map((set) => ({
        jogoId: Number(jogoId),
        numeroSet: set.numeroSet,
        pontosA: set.pontosA,
        pontosB: set.pontosB
      }))
    });

    await tx.jogo.update({
      where: {
        id: Number(jogoId)
      },
      data: {
        status: "FINALIZADO",
        vencedorId
      }
    });
  });

  await chaveamentoServico.gerarProximaFaseSePossivel(jogo.campeonatoId);

  const jogoAtualizado = await prisma.jogo.findUnique({
    where: {
      id: Number(jogoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true,
      sets: {
        orderBy: {
          numeroSet: "asc"
        }
      }
    }
  });

  return jogoAtualizado;
}

async function buscarJogoPorId(jogoId) {
  const jogo = await prisma.jogo.findUnique({
    where: {
      id: Number(jogoId)
    },
    include: {
      equipeA: true,
      equipeB: true,
      vencedor: true,
      sets: {
        orderBy: {
          numeroSet: "asc"
        }
      }
    }
  });

  if (!jogo) {
    throw new Error("Jogo não encontrado.");
  }

  return jogo;
}

export default {
  registrarPlacar,
  buscarJogoPorId
};