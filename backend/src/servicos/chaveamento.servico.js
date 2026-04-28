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

  if (fase === "REPESCAGEM") {
    return "REPESCAGEM";
  }

  if (fase.startsWith("FASE_GRUPOS")) {
    return "FASE_GRUPOS";
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
        equipeBId: equipes[1].id,
        ordem: 1
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
      equipeBId: equipes[i + 1].id,
      ordem: numeroJogo
    });
  }

  await prisma.jogo.createMany({
    data: jogos
  });
}

function montarJogosGrupo(campeonatoId, grupo, equipes) {
  return [
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 1,
      ordem: 1,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[0].id,
      equipeBId: equipes[3].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 1,
      ordem: 2,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[1].id,
      equipeBId: equipes[2].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 2,
      ordem: 3,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[0].id,
      equipeBId: equipes[2].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 2,
      ordem: 4,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[3].id,
      equipeBId: equipes[1].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 3,
      ordem: 5,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[0].id,
      equipeBId: equipes[1].id
    },
    {
      fase: "FASE_GRUPOS",
      grupo,
      rodada: 3,
      ordem: 6,
      campeonatoId: Number(campeonatoId),
      equipeAId: equipes[2].id,
      equipeBId: equipes[3].id
    }
  ];
}

async function gerarFaseDeGruposComRepescagem(campeonatoId, participantes) {
  if (participantes.length !== 12) {
    throw new Error(
      "O formato Fase de grupos + repescagem + mata-mata precisa ter exatamente 12 participantes aprovados."
    );
  }

  const participantesEmbaralhados = embaralharLista(participantes);

  const grupoA = participantesEmbaralhados.slice(0, 4);
  const grupoB = participantesEmbaralhados.slice(4, 8);
  const grupoC = participantesEmbaralhados.slice(8, 12);

  const jogos = [
    ...montarJogosGrupo(campeonatoId, "A", grupoA),
    ...montarJogosGrupo(campeonatoId, "B", grupoB),
    ...montarJogosGrupo(campeonatoId, "C", grupoC)
  ];

  await prisma.jogo.createMany({
    data: jogos
  });
}

function criarTabelaGrupo(jogosDoGrupo) {
  const tabela = new Map();

  function garantirEquipe(equipe) {
    if (!equipe) {
      return;
    }

    if (!tabela.has(equipe.id)) {
      tabela.set(equipe.id, {
        participante: equipe,
        jogos: 0,
        vitorias: 0,
        derrotas: 0,
        setsPro: 0,
        setsContra: 0,
        pontosPro: 0,
        pontosContra: 0,
        saldoSets: 0,
        saldoPontos: 0
      });
    }
  }

  jogosDoGrupo.forEach((jogo) => {
    garantirEquipe(jogo.equipeA);
    garantirEquipe(jogo.equipeB);

    const equipeA = tabela.get(jogo.equipeAId);
    const equipeB = tabela.get(jogo.equipeBId);

    equipeA.jogos += 1;
    equipeB.jogos += 1;

    if (jogo.vencedorId === jogo.equipeAId) {
      equipeA.vitorias += 1;
      equipeB.derrotas += 1;
    }

    if (jogo.vencedorId === jogo.equipeBId) {
      equipeB.vitorias += 1;
      equipeA.derrotas += 1;
    }

    jogo.sets.forEach((set) => {
      equipeA.pontosPro += set.pontosA;
      equipeA.pontosContra += set.pontosB;

      equipeB.pontosPro += set.pontosB;
      equipeB.pontosContra += set.pontosA;

      if (set.pontosA > set.pontosB) {
        equipeA.setsPro += 1;
        equipeA.setsContra += 0;
        equipeB.setsPro += 0;
        equipeB.setsContra += 1;
      }

      if (set.pontosB > set.pontosA) {
        equipeB.setsPro += 1;
        equipeB.setsContra += 0;
        equipeA.setsPro += 0;
        equipeA.setsContra += 1;
      }
    });
  });

  const classificados = Array.from(tabela.values()).map((item) => ({
    ...item,
    saldoSets: item.setsPro - item.setsContra,
    saldoPontos: item.pontosPro - item.pontosContra
  }));

  classificados.sort((a, b) => {
    if (b.vitorias !== a.vitorias) {
      return b.vitorias - a.vitorias;
    }

    if (b.saldoSets !== a.saldoSets) {
      return b.saldoSets - a.saldoSets;
    }

    if (b.saldoPontos !== a.saldoPontos) {
      return b.saldoPontos - a.saldoPontos;
    }

    const confrontoDireto = jogosDoGrupo.find((jogo) => {
      const envolveA =
        jogo.equipeAId === a.participante.id || jogo.equipeBId === a.participante.id;

      const envolveB =
        jogo.equipeAId === b.participante.id || jogo.equipeBId === b.participante.id;

      return envolveA && envolveB && jogo.vencedorId;
    });

    if (confrontoDireto) {
      if (confrontoDireto.vencedorId === a.participante.id) {
        return -1;
      }

      if (confrontoDireto.vencedorId === b.participante.id) {
        return 1;
      }
    }

    return Math.random() - 0.5;
  });

  return classificados;
}

function montarClassificacaoDosGrupos(jogos) {
  const jogosFaseGrupos = jogos.filter((jogo) => jogo.fase === "FASE_GRUPOS");

  const grupos = {
    A: jogosFaseGrupos.filter((jogo) => jogo.grupo === "A"),
    B: jogosFaseGrupos.filter((jogo) => jogo.grupo === "B"),
    C: jogosFaseGrupos.filter((jogo) => jogo.grupo === "C")
  };

  return {
    A: criarTabelaGrupo(grupos.A),
    B: criarTabelaGrupo(grupos.B),
    C: criarTabelaGrupo(grupos.C)
  };
}

function faseFoiFinalizada(jogos) {
  return jogos.every((jogo) => jogo.status === "FINALIZADO" && jogo.vencedorId);
}

async function gerarProximaFaseGruposRepescagem(campeonatoId, campeonato) {
  const jogos = campeonato.jogos;

  const jogosFaseGrupos = jogos.filter((jogo) => jogo.fase === "FASE_GRUPOS");
  const jogoRepescagem = jogos.find((jogo) => jogo.fase === "REPESCAGEM");
  const jogosQuartas = jogos.filter((jogo) => jogo.fase.startsWith("QUARTAS"));
  const jogosSemifinais = jogos.filter((jogo) => jogo.fase.startsWith("SEMIFINAL"));
  const jogoFinal = jogos.find((jogo) => jogo.fase === "FINAL");

  if (!jogosFaseGrupos.length) {
    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosFaseGrupos)) {
    return await listarJogos(campeonatoId);
  }

  const classificacao = montarClassificacaoDosGrupos(jogos);

  const primeiroA = classificacao.A[0]?.participante;
  const segundoA = classificacao.A[1]?.participante;
  const terceiroA = classificacao.A[2];

  const primeiroB = classificacao.B[0]?.participante;
  const segundoB = classificacao.B[1]?.participante;
  const terceiroB = classificacao.B[2];

  const primeiroC = classificacao.C[0]?.participante;
  const segundoC = classificacao.C[1]?.participante;
  const terceiroC = classificacao.C[2];

  const terceiros = [
    { grupo: "A", ...terceiroA },
    { grupo: "B", ...terceiroB },
    { grupo: "C", ...terceiroC }
  ];

  terceiros.sort((a, b) => {
    if (b.vitorias !== a.vitorias) {
      return b.vitorias - a.vitorias;
    }

    if (b.saldoSets !== a.saldoSets) {
      return b.saldoSets - a.saldoSets;
    }

    if (b.saldoPontos !== a.saldoPontos) {
      return b.saldoPontos - a.saldoPontos;
    }

    return Math.random() - 0.5;
  });

  const melhorTerceiro = terceiros[0]?.participante;
  const terceirosRepescagem = terceiros.slice(1).map((item) => item.participante);

  if (!jogoRepescagem) {
    await prisma.jogo.create({
      data: {
        fase: "REPESCAGEM",
        campeonatoId: Number(campeonatoId),
        equipeAId: terceirosRepescagem[0].id,
        equipeBId: terceirosRepescagem[1].id,
        ordem: 1
      }
    });

    return await listarJogos(campeonatoId);
  }

  if (jogoRepescagem.status !== "FINALIZADO" || !jogoRepescagem.vencedorId) {
    return await listarJogos(campeonatoId);
  }

  if (!jogosQuartas.length) {
    await prisma.jogo.createMany({
      data: [
        {
          fase: "QUARTAS_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroA.id,
          equipeBId: segundoC.id,
          ordem: 1
        },
        {
          fase: "QUARTAS_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroB.id,
          equipeBId: segundoA.id,
          ordem: 2
        },
        {
          fase: "QUARTAS_3",
          campeonatoId: Number(campeonatoId),
          equipeAId: primeiroC.id,
          equipeBId: segundoB.id,
          ordem: 3
        },
        {
          fase: "QUARTAS_4",
          campeonatoId: Number(campeonatoId),
          equipeAId: melhorTerceiro.id,
          equipeBId: jogoRepescagem.vencedorId,
          ordem: 4
        }
      ]
    });

    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosQuartas)) {
    return await listarJogos(campeonatoId);
  }

  if (!jogosSemifinais.length) {
    const quartas1 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_1");
    const quartas2 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_2");
    const quartas3 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_3");
    const quartas4 = jogosQuartas.find((jogo) => jogo.fase === "QUARTAS_4");

    await prisma.jogo.createMany({
      data: [
        {
          fase: "SEMIFINAL_1",
          campeonatoId: Number(campeonatoId),
          equipeAId: quartas1.vencedorId,
          equipeBId: quartas4.vencedorId,
          ordem: 1
        },
        {
          fase: "SEMIFINAL_2",
          campeonatoId: Number(campeonatoId),
          equipeAId: quartas2.vencedorId,
          equipeBId: quartas3.vencedorId,
          ordem: 2
        }
      ]
    });

    return await listarJogos(campeonatoId);
  }

  if (!faseFoiFinalizada(jogosSemifinais)) {
    return await listarJogos(campeonatoId);
  }

  if (!jogoFinal) {
    const semifinal1 = jogosSemifinais.find((jogo) => jogo.fase === "SEMIFINAL_1");
    const semifinal2 = jogosSemifinais.find((jogo) => jogo.fase === "SEMIFINAL_2");

    await prisma.jogo.create({
      data: {
        fase: "FINAL",
        campeonatoId: Number(campeonatoId),
        equipeAId: semifinal1.vencedorId,
        equipeBId: semifinal2.vencedorId,
        ordem: 1
      }
    });

    return await listarJogos(campeonatoId);
  }

  return await listarJogos(campeonatoId);
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

  if (campeonato.formato === "GRUPOS_3X4_REPESCAGEM") {
    await gerarFaseDeGruposComRepescagem(campeonatoId, participantes);
    return await listarJogos(campeonatoId);
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
    orderBy: [
      {
        criadoEm: "asc"
      },
      {
        id: "asc"
      }
    ]
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
          vencedor: true,
          sets: true
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

  if (campeonato.formato === "GRUPOS_3X4_REPESCAGEM") {
    return await gerarProximaFaseGruposRepescagem(campeonatoId, campeonato);
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
            equipeBId: vencedor2.id,
            ordem: 1
          },
          {
            fase: "TERCEIRO_LUGAR",
            campeonatoId: Number(campeonatoId),
            equipeAId: perdedor1.id,
            equipeBId: perdedor2.id,
            ordem: 1
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
          equipeBId: classificados[1].id,
          ordem: 1
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