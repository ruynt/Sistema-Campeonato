import {
  buscarResumoCampeonato,
  encerrarInscricoes,
  gerarChaveamento,
  registrarPlacar,
  excluirInscricao,
  excluirCampeonato,
  obterToken
} from "./api.js";

const params = new URLSearchParams(window.location.search);
const campeonatoId = params.get("id");

const dadosCampeonato = document.getElementById("dados-campeonato");
const listaParticipantes = document.getElementById("lista-participantes");
const listaJogos = document.getElementById("lista-jogos");
const podio = document.getElementById("podio");
const mensagemCampeonato = document.getElementById("mensagem-campeonato");
const botaoEncerrar = document.getElementById("botao-encerrar");
const botaoChaveamento = document.getElementById("botao-chaveamento");
const botaoCopiarLink = document.getElementById("botao-copiar-link");
const botaoExcluirCampeonato = document.getElementById("botao-excluir-campeonato");
const botaoLogout = document.getElementById("botao-logout");
const usuarioLogadoBox = document.getElementById("usuario-logado-box");

let resumoAtual = null;

function obterOrganizadorLogado() {
  const dados = localStorage.getItem("organizadorLogado");
  return dados ? JSON.parse(dados) : null;
}

function estaAutenticado() {
  return Boolean(obterToken());
}

function protegerPagina() {
  if (!estaAutenticado()) {
    window.location.href = "./login.html";
  }
}

function configurarSessao() {
  const organizador = obterOrganizadorLogado();

  if (!organizador) {
    usuarioLogadoBox.innerHTML = "<p>Nenhum organizador autenticado.</p>";
    return;
  }

  usuarioLogadoBox.innerHTML = `
    <p><strong>Organizador logado:</strong> ${organizador.nome}</p>
    <p><strong>E-mail:</strong> ${organizador.email}</p>
  `;
}

function sair() {
  localStorage.removeItem("tokenOrganizador");
  localStorage.removeItem("organizadorLogado");
  window.location.href = "./login.html";
}

function formatarData(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function traduzirFase(fase) {
  const mapa = {
    SEMIFINAL_1: "Semifinal 1",
    SEMIFINAL_2: "Semifinal 2",
    FINAL: "Final",
    TERCEIRO_LUGAR: "3º Lugar",
    PRIMEIRA_FASE: "Primeira Fase"
  };

  return mapa[fase] || fase;
}

function traduzirStatusCampeonato(status) {
  const mapa = {
    INSCRICOES_ABERTAS: "Inscrições abertas",
    AGUARDANDO_CHAVEAMENTO: "Aguardando chaveamento",
    EM_ANDAMENTO: "Em andamento",
    FINALIZADO: "Finalizado"
  };

  return mapa[status] || status;
}

function classeStatusCampeonato(status) {
  const mapa = {
    INSCRICOES_ABERTAS: "status-inscricoes",
    AGUARDANDO_CHAVEAMENTO: "status-aguardando",
    EM_ANDAMENTO: "status-andamento",
    FINALIZADO: "status-finalizado"
  };

  return mapa[status] || "status-aguardando";
}

function quantidadeMinimaParaChaveamento() {
  return 2;
}

function quantidadeValidaParaGerarChaveamento(resumo) {
  const total = resumo.totais.participantes;

  if (total < quantidadeMinimaParaChaveamento()) {
    return false;
  }

  return total === 2 || total === 4;
}

function mensagemApoioChaveamento(resumo) {
  const total = resumo.totais.participantes;

  if (resumo.jogos.length > 0) {
    return "O chaveamento já foi gerado para este campeonato.";
  }

  if (resumo.campeonato.inscricoesAbertas) {
    return "Feche as inscrições antes de gerar o chaveamento.";
  }

  if (total < 2) {
    return "É necessário ter pelo menos 2 participantes para gerar o chaveamento.";
  }

  if (total !== 2 && total !== 4) {
    return "Nesta versão, o sistema gera chaveamento apenas com 2 ou 4 participantes.";
  }

  return "Campeonato pronto para gerar chaveamento.";
}

function atualizarEstadoBotoes(resumo) {
  const inscricoesFechadas = !resumo.campeonato.inscricoesAbertas;
  const jaTemJogos = resumo.jogos.length > 0;
  const finalizado = resumo.statusCampeonato === "FINALIZADO";
  const podeGerar = quantidadeValidaParaGerarChaveamento(resumo);

  botaoEncerrar.disabled = inscricoesFechadas || finalizado;
  botaoChaveamento.disabled =
    jaTemJogos ||
    finalizado ||
    resumo.campeonato.inscricoesAbertas ||
    !podeGerar;
}

function renderizarResumo(resumo) {
  const campeonato = resumo.campeonato;
  const textoStatus = traduzirStatusCampeonato(resumo.statusCampeonato);
  const classeStatus = classeStatusCampeonato(resumo.statusCampeonato);
  const mensagemChaveamento = mensagemApoioChaveamento(resumo);

  dadosCampeonato.innerHTML = `
    <div class="bloco-informacoes">
      <p><strong>Nome:</strong> ${campeonato.nome}</p>
      <p><strong>Data:</strong> ${formatarData(campeonato.data)}</p>
      <p><strong>Local:</strong> ${campeonato.local || "Não informado"}</p>
      <p><strong>Tipo:</strong> ${campeonato.tipoParticipante}</p>
      <p><strong>Categoria:</strong> ${campeonato.categoria}</p>
      <p><strong>Quantidade máxima:</strong> ${campeonato.quantidadeMaxima ?? "Não definida"}</p>
      <p><strong>Inscrições abertas:</strong> ${campeonato.inscricoesAbertas ? "Sim" : "Não"}</p>
      <p><strong>Total de participantes:</strong> ${resumo.totais.participantes}</p>
      <p><strong>Total de jogos:</strong> ${resumo.totais.jogos}</p>
      <p><strong>Jogos finalizados:</strong> ${resumo.totais.jogosFinalizados}</p>
      <span class="status-badge ${classeStatus}">${textoStatus}</span>
      <p class="info-auxiliar">Use o botão de copiar link para enviar a página pública de inscrição aos participantes.</p>
      <p class="info-auxiliar"><strong>Chaveamento:</strong> ${mensagemChaveamento}</p>
    </div>
  `;
}

function renderizarParticipantes(participantes) {
  if (!participantes.length) {
    listaParticipantes.innerHTML = "<p>Nenhum participante inscrito.</p>";
    return;
  }

  const podeExcluirInscricao = resumoAtual ? resumoAtual.jogos.length === 0 : false;

  listaParticipantes.innerHTML = `
    <div class="lista-simples">
      ${participantes
        .map(
          (participante) => `
            <div class="item-lista">
              <h3>${participante.nomeEquipe}</h3>
              <p><strong>Responsável:</strong> ${participante.responsavel}</p>
              <p><strong>Contato:</strong> ${participante.contato || "Não informado"}</p>
              <p><strong>Status:</strong> ${participante.statusInscricao}</p>
              <ul>
                ${participante.jogadores
                  .map((jogador) => `<li>${jogador.nome} (${jogador.genero})</li>`)
                  .join("")}
              </ul>

              ${
                podeExcluirInscricao
                  ? `
                    <button
                      class="botao-pequeno botao-excluir"
                      data-inscricao-id="${participante.id}"
                    >
                      Excluir inscrição
                    </button>
                  `
                  : `
                    <p class="info-auxiliar">
                      A exclusão de inscrição fica indisponível após gerar o chaveamento.
                    </p>
                  `
              }
            </div>
          `
        )
        .join("")}
    </div>
  `;

  if (podeExcluirInscricao) {
    conectarEventosExclusaoInscricao();
  }
}

function montarSetsExistentes(jogo) {
  if (!jogo.sets.length) {
    return "<p>Nenhum set registrado.</p>";
  }

  return `
    <ul>
      ${jogo.sets
        .map(
          (set) =>
            `<li>Set ${set.numeroSet}: ${set.pontosA} x ${set.pontosB}</li>`
        )
        .join("")}
    </ul>
  `;
}

function montarFormularioPlacar(jogo) {
  if (jogo.status === "FINALIZADO") {
    return "";
  }

  return `
    <form class="formulario-placar" data-jogo-id="${jogo.id}">
      <div class="grade-sets">
        <div class="linha-set">
          <strong>Set 1</strong>
          <div>
            <label>Pontos equipe A</label>
            <input type="number" name="set1a" min="0" required />
          </div>
          <div>
            <label>Pontos equipe B</label>
            <input type="number" name="set1b" min="0" required />
          </div>
        </div>

        <div class="linha-set">
          <strong>Set 2</strong>
          <div>
            <label>Pontos equipe A</label>
            <input type="number" name="set2a" min="0" required />
          </div>
          <div>
            <label>Pontos equipe B</label>
            <input type="number" name="set2b" min="0" required />
          </div>
        </div>

        <div class="linha-set">
          <strong>Set 3</strong>
          <div>
            <label>Pontos equipe A</label>
            <input type="number" name="set3a" min="0" />
          </div>
          <div>
            <label>Pontos equipe B</label>
            <input type="number" name="set3b" min="0" />
          </div>
        </div>
      </div>

      <button type="submit" class="botao-pequeno">Salvar placar</button>
      <p class="mensagem-jogo" id="mensagem-jogo-${jogo.id}"></p>
    </form>
  `;
}

function conectarEventosExclusaoInscricao() {
  const botoes = document.querySelectorAll("[data-inscricao-id]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", async () => {
      const inscricaoId = botao.dataset.inscricaoId;
      const confirmar = window.confirm("Tem certeza que deseja excluir esta inscrição?");

      if (!confirmar) {
        return;
      }

      try {
        mensagemCampeonato.textContent = "Excluindo inscrição...";
        await excluirInscricao(inscricaoId);
        await carregarResumo(false);
        mensagemCampeonato.textContent = "Inscrição excluída com sucesso.";
      } catch (error) {
        mensagemCampeonato.textContent = `Erro ao excluir inscrição: ${error.message}`;
      }
    });
  });
}

function renderizarJogos(jogos) {
  if (!jogos.length) {
    listaJogos.innerHTML = "<p>Nenhum jogo gerado ainda.</p>";
    return;
  }

  listaJogos.innerHTML = `
    <div class="lista-simples">
      ${jogos
        .map((jogo) => {
          const nomeEquipeA = jogo.equipeA?.nomeEquipe || "A definir";
          const nomeEquipeB = jogo.equipeB?.nomeEquipe || "A definir";
          const nomeVencedor = jogo.vencedor?.nomeEquipe || "Ainda não definido";

          return `
            <div class="item-lista">
              <h3>${traduzirFase(jogo.fase)}</h3>
              <p><strong>Status:</strong> ${jogo.status}</p>

              <div class="confronto-visual">
                <div class="equipe-box">${nomeEquipeA}</div>
                <div class="vs-box">VS</div>
                <div class="equipe-box">${nomeEquipeB}</div>
              </div>

              <p><strong>Vencedor:</strong> ${nomeVencedor}</p>
              <div>
                <strong>Sets:</strong>
                ${montarSetsExistentes(jogo)}
              </div>
              ${montarFormularioPlacar(jogo)}
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  conectarEventosPlacar();
}

function renderizarPodio(dadosPodio) {
  if (!dadosPodio) {
    podio.innerHTML = "<p>Pódio ainda não definido.</p>";
    return;
  }

  podio.innerHTML = `
    <div class="podio-grid">
      <div class="card-podio">
        <h3>🥇 1º Lugar</h3>
        <p>${dadosPodio.primeiroLugar?.nomeEquipe || "—"}</p>
      </div>
      <div class="card-podio">
        <h3>🥈 2º Lugar</h3>
        <p>${dadosPodio.segundoLugar?.nomeEquipe || "—"}</p>
      </div>
      <div class="card-podio">
        <h3>🥉 3º Lugar</h3>
        <p>${dadosPodio.terceiroLugar?.nomeEquipe || "—"}</p>
      </div>
    </div>
  `;
}

function extrairSetsDoFormulario(form) {
  const set1a = form.querySelector('[name="set1a"]').value;
  const set1b = form.querySelector('[name="set1b"]').value;
  const set2a = form.querySelector('[name="set2a"]').value;
  const set2b = form.querySelector('[name="set2b"]').value;
  const set3a = form.querySelector('[name="set3a"]').value;
  const set3b = form.querySelector('[name="set3b"]').value;

  const sets = [
    { numeroSet: 1, pontosA: Number(set1a), pontosB: Number(set1b) },
    { numeroSet: 2, pontosA: Number(set2a), pontosB: Number(set2b) }
  ];

  const terceiroPreenchido = set3a !== "" && set3b !== "";

  if (terceiroPreenchido) {
    sets.push({
      numeroSet: 3,
      pontosA: Number(set3a),
      pontosB: Number(set3b)
    });
  }

  return sets;
}

function conectarEventosPlacar() {
  const formularios = document.querySelectorAll(".formulario-placar");

  formularios.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const jogoId = form.dataset.jogoId;
      const mensagemJogo = document.getElementById(`mensagem-jogo-${jogoId}`);

      try {
        mensagemJogo.textContent = "Salvando placar...";
        const sets = extrairSetsDoFormulario(form);
        await registrarPlacar(jogoId, sets);
        mensagemCampeonato.textContent = "Placar registrado com sucesso.";
        await carregarResumo(false);
      } catch (error) {
        mensagemJogo.textContent = `Erro ao salvar placar: ${error.message}`;
      }
    });
  });
}

async function copiarLinkInscricao() {
  const url = `${window.location.origin}${window.location.pathname.replace("campeonato.html", "inscricao.html")}?id=${campeonatoId}`;

  try {
    await navigator.clipboard.writeText(url);
    mensagemCampeonato.textContent = "Link da inscrição copiado com sucesso.";
  } catch {
    mensagemCampeonato.textContent = `Copie manualmente este link: ${url}`;
  }
}

async function carregarResumo(limparMensagemPrincipal = true) {
  if (!campeonatoId) {
    mensagemCampeonato.textContent = "ID do campeonato não informado na URL.";
    return;
  }

  try {
    if (limparMensagemPrincipal) {
      mensagemCampeonato.textContent = "Carregando campeonato...";
    }

    const resumo = await buscarResumoCampeonato(campeonatoId);
    resumoAtual = resumo;

    renderizarResumo(resumo);
    renderizarParticipantes(resumo.participantes);
    renderizarJogos(resumo.jogos);
    renderizarPodio(resumo.podio);
    atualizarEstadoBotoes(resumo);

    if (limparMensagemPrincipal) {
      mensagemCampeonato.textContent = "";
    }
  } catch (error) {
    mensagemCampeonato.textContent = `Erro ao carregar campeonato: ${error.message}`;
  }
}

botaoCopiarLink.addEventListener("click", copiarLinkInscricao);
botaoLogout.addEventListener("click", sair);

botaoEncerrar.addEventListener("click", async () => {
  try {
    mensagemCampeonato.textContent = "Encerrando inscrições...";
    await encerrarInscricoes(campeonatoId);
    await carregarResumo(false);
    mensagemCampeonato.textContent = "Inscrições encerradas com sucesso.";
  } catch (error) {
    mensagemCampeonato.textContent = `Erro ao encerrar inscrições: ${error.message}`;
  }
});

botaoChaveamento.addEventListener("click", async () => {
  try {
    mensagemCampeonato.textContent = "Gerando chaveamento...";
    await gerarChaveamento(campeonatoId);
    await carregarResumo(false);
    mensagemCampeonato.textContent = "Chaveamento gerado com sucesso.";
  } catch (error) {
    mensagemCampeonato.textContent = `Erro ao gerar chaveamento: ${error.message}`;
  }
});

botaoExcluirCampeonato.addEventListener("click", async () => {
  const confirmar = window.confirm("Tem certeza que deseja excluir este campeonato?");

  if (!confirmar) {
    return;
  }

  try {
    mensagemCampeonato.textContent = "Excluindo campeonato...";
    await excluirCampeonato(campeonatoId);
    window.location.href = "./inicio.html";
  } catch (error) {
    mensagemCampeonato.textContent = `Erro ao excluir campeonato: ${error.message}`;
  }
});

protegerPagina();
configurarSessao();
carregarResumo();