import { prisma } from "../banco/prisma.js";

function montarResumo(campeonato, incluirContato = false) {
  const totalParticipantes = campeonato.participantes.length;
  const totalJogos = campeonato.jogos.length;
  const jogosFinalizados = campeonato.jogos.filter(
    (jogo) => jogo.status === "FINALIZADO"
  ).length;

  const final = campeonato.jogos.find(
    (jogo) => jogo.fase === "FINAL" && jogo.status === "FINALIZADO" && jogo.vencedor
  );

  const terceiroLugarJogo = campeonato.jogos.find(
    (jogo) =>
      jogo.fase === "TERCEIRO_LUGAR" &&
      jogo.status === "FINALIZADO" &&
      jogo.vencedor
  );

  let podio = null;

  if (final) {
    const primeiroLugar = final.vencedor;
    const segundoLugar =
      final.equipeAId === primeiroLugar.id ? final.equipeB : final.equipeA;

    podio = {
      primeiroLugar,
      segundoLugar,
      terceiroLugar: terceiroLugarJogo ? terceiroLugarJogo.vencedor : null
    };
  }

  let statusCampeonato = "INSCRICOES_ABERTAS";

  if (!campeonato.inscricoesAbertas && campeonato.jogos.length === 0) {
    statusCampeonato = "AGUARDANDO_CHAVEAMENTO";
  }

  if (campeonato.jogos.length > 0 && !final) {
    statusCampeonato = "EM_ANDAMENTO";
  }

  if (final) {
    statusCampeonato = "FINALIZADO";
  }

  const participantes = campeonato.participantes.map((participante) => ({
    id: participante.id,
    nomeEquipe: participante.nomeEquipe,
    responsavel: participante.responsavel,
    ...(incluirContato ? { contato: participante.contato } : {}),
    statusInscricao: participante.statusInscricao,
    criadoEm: participante.criadoEm,
    campeonatoId: participante.campeonatoId,
    usuarioId: participante.usuarioId,
    jogadores: participante.jogadores
  }));

  return {
    campeonato: {
      id: campeonato.id,
      nome: campeonato.nome,
      data: campeonato.data,
      local: campeonato.local,
      tipoParticipante: campeonato.tipoParticipante,
      categoria: campeonato.categoria,
      formato: campeonato.formato,
      quantidadeMaxima: campeonato.quantidadeMaxima,
      inscricoesAbertas: campeonato.inscricoesAbertas,
      criadoEm: campeonato.criadoEm
    },
    statusCampeonato,
    totais: {
      participantes: totalParticipantes,
      jogos: totalJogos,
      jogosFinalizados
    },
    participantes,
    jogos: campeonato.jogos,
    podio
  };
}

async function buscarCampeonatoComRelacionamentos(campeonatoId) {
  const campeonato = await prisma.campeonato.findUnique({
    where: {
      id: Number(campeonatoId)
    },
    include: {
      participantes: {
        include: {
          jogadores: true
        },
        orderBy: {
          criadoEm: "asc"
        }
      },
      jogos: {
        include: {
          equipeA: true,
          equipeB: true,
          vencedor: true,
          sets: {
            orderBy: {
              numeroSet: "asc"
            }
          }
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

  return campeonato;
}

async function buscarResumoAdmin(campeonatoId) {
  const campeonato = await buscarCampeonatoComRelacionamentos(campeonatoId);
  return montarResumo(campeonato, true);
}

async function buscarResumoPublico(campeonatoId) {
  const campeonato = await buscarCampeonatoComRelacionamentos(campeonatoId);
  return montarResumo(campeonato, false);
}

export default {
  buscarResumoAdmin,
  buscarResumoPublico
};