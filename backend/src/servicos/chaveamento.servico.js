import { prisma } from "../banco/prisma.js";
import { embaralharLista } from "../utilitarios/sorteio.js";

function proximaPotenciaDeDois(numero) {
  let potencia = 1;

  while (potencia < numero) {
    potencia *= 2;
  }

  return potencia;
}

function obterBaseFasePorQuantidadeEquipes(quantidadeEquipes) {
  if (quantidadeEquipes === 2) {
    return "FINAL";
  }

  if (quantidadeEquipes === 4) {
    return "SEMIFINAL";
  }

  if (quantidadeEquipes === 8) {
    return "QUARTAS";
  }

  if (quantidadeEquipes === 16) {
    return "OITAVAS";
  }

  return `RODADA_${quantidadeEquipes}`;
}

function obterBaseDaFase(fase) {
  if (fase === "FINAL" || fase === "TERCEIRO_LUGAR") {
    return fase;
  }

  if (fase.startsWith("PRIMEIRA_FASE")) {
    return "PRIMEIRA_FASE";
  }

  if (fase.startsWith("SEMIFINAL")) {
    return "SEMIFINAL";
  }

  if (fase.startsWith("QUARTAS")) {
    return "QUARTAS";
  }

  if (fase.startsWith("OITAVAS")) {
    return "OITAVAS";
  }

  const faseSemIndice = fase.match(/^(.*)_\d+$/);
  if (faseSemIndice) {
    return faseSemIndice[1];
  }

  return fase;
}

async function criarJogosDaFase(campeonatoId, baseFase, equipes) {
  if (equipes.length < 2 || equipes.length % 2 !== 0) {
    throw new Error("Quantidade inválida de equipes para montar a fase.");
  }

  if (baseFase === "FINAL") {
    await prisma.jogo.create({
      data: {
        fase: "FINAL",
        campeonatoId: Number(campeonatoId),
        equipeAId: equipes[0].id,
        equipeBId: equipes[1].id
      }
    });

    return;
  }

  const jogos = [];

  for (let i = 0; i < equipes.length; i += 2) {
    const numeroJogo = i / 2 + 1;

    let fase = `${baseFase}_${numeroJogo}`;

    if (baseFase === "SEMIFINAL") {
      fase = `SEMIFINAL_${numeroJogo}`;
    }

    jogos.push({
      fase,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[i].id,
      equipeBId: equipes[i + 1].id
    });
  }

  await prisma.jogo.createMany({
    data: jogos
  });
}

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
  const quantidadeParticipantes = participantesEmbaralhados.length;
  const tamanhoChave = proximaPotenciaDeDois(quantidadeParticipantes);
  const equipesNaProximaRodada = tamanhoChave / 2;
  const jogosPrimeiraRodada = quantidadeParticipantes - equipesNaProximaRodada;

  if (jogosPrimeiraRodada <= 0) {
    const baseFase = obterBaseFasePorQuantidadeEquipes(quantidadeParticipantes);
    await criarJogosDaFase(campeonatoId, baseFase, participantesEmbaralhados);
    return await listarJogos(campeonatoId);
  }

  const quantidadeEquipesNaPrimeiraRodada = jogosPrimeiraRodada * 2;
  const equipesQueJogamPrimeiraRodada = participantesEmbaralhados.slice(
    0,
    quantidadeEquipesNaPrimeiraRodada
  );

  await criarJogosDaFase(
    campeonatoId,
    "PRIMEIRA_FASE",
    equipesQueJogamPrimeiraRodada
  );

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
      jogos: {
        include: {
          equipeA: true,
          equipeB: true,
          vencedor: true
        },
        orderBy: {
          id: "asc"
        }
      }
    }
  });

  if (!campeonato) {
    throw new Error("Campeonato não encontrado.");
  }

  const jogos = campeonato.jogos;

  if (!jogos.length) {
    return await listarJogos(campeonatoId);
  }

  const grupos = new Map();

  jogos.forEach((jogo) => {
    if (jogo.fase === "TERCEIRO_LUGAR") {
      return;
    }

    const baseFase = obterBaseDaFase(jogo.fase);

    if (!grupos.has(baseFase)) {
      grupos.set(baseFase, []);
    }

    grupos.get(baseFase).push(jogo);
  });

  const rodadas = Array.from(grupos.entries()).map(([fase, jogosDaFase]) => ({
    fase,
    jogos: jogosDaFase
  }));

  const ultimaRodada = rodadas[rodadas.length - 1];

  if (!ultimaRodada || ultimaRodada.fase === "FINAL") {
    return await listarJogos(campeonatoId);
  }

  const rodadaFinalizada = ultimaRodada.jogos.every(
    (jogo) => jogo.status === "FINALIZADO" && jogo.vencedorId
  );

  if (!rodadaFinalizada) {
    return await listarJogos(campeonatoId);
  }

  const finalExistente = jogos.find((jogo) => jogo.fase === "FINAL");
  const terceiroExistente = jogos.find((jogo) => jogo.fase === "TERCEIRO_LUGAR");

  if (ultimaRodada.fase === "SEMIFINAL") {
    if (!finalExistente && !terceiroExistente) {
      const semifinal1 = ultimaRodada.jogos.find((jogo) => jogo.fase === "SEMIFINAL_1");
      const semifinal2 = ultimaRodada.jogos.find((jogo) => jogo.fase === "SEMIFINAL_2");

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

  const vencedores = ultimaRodada.jogos.map((jogo) => jogo.vencedor);

  const idsJaUsados = new Set(
    jogos.flatMap((jogo) => [jogo.equipeAId, jogo.equipeBId]).filter(Boolean)
  );

  const equipesComBye = campeonato.participantes.filter(
    (participante) => !idsJaUsados.has(participante.id)
  );

  const classificados =
    ultimaRodada.fase === "PRIMEIRA_FASE"
      ? [...equipesComBye, ...vencedores]
      : vencedores;

  if (classificados.length < 2) {
    return await listarJogos(campeonatoId);
  }

  if (classificados.length === 2) {
    if (!finalExistente) {
      await prisma.jogo.create({
        data: {
          fase: "FINAL",
          campeonatoId: Number(campeonatoId),
          equipeAId: classificados[0].id,
          equipeBId: classificados[1].id
        }
      });
    }

    return await listarJogos(campeonatoId);
  }

  const baseProximaFase = obterBaseFasePorQuantidadeEquipes(classificados.length);
  await criarJogosDaFase(campeonatoId, baseProximaFase, classificados);

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