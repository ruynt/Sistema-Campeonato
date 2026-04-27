import {
  buscarResumoCampeonato,
  encerrarInscricoes,
  reabrirInscricoes,
  gerarChaveamento,
  registrarPlacar,
  excluirInscricao,
  excluirCampeonato,
  atualizarInscricao,
  atualizarCampeonato,
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
const botaoReabrir = document.getElementById("botao-reabrir");
const botaoChaveamento = document.getElementById("botao-chaveamento");
const botaoCopiarLink = document.getElementById("botao-copiar-link");
const botaoExcluirCampeonato = document.getElementById("botao-excluir-campeonato");
const botaoLogout = document.getElementById("botao-logout");
const usuarioLogadoBox = document.getElementById("usuario-logado-box");
const chaveCampeonato = document.getElementById("chave-campeonato");

let resumoAtual = null;
let inscricaoEmEdicaoId = null;
let campeonatoEmEdicao = false;

function obterAdminLogado() {
  const dados = localStorage.getItem("adminLogado");
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
  const admin = obterAdminLogado();

  if (!admin) {
    usuarioLogadoBox.innerHTML = "<p>Nenhum administrador autenticado.</p>";
    return;
  }

  usuarioLogadoBox.innerHTML = `
    <p><strong>Administrador logado:</strong> ${admin.nome}</p>
    <p><strong>E-mail:</strong> ${admin.email}</p>
  `;
}

function sair() {
  localStorage.removeItem("tokenAdmin");
  localStorage.removeItem("adminLogado");
  window.location.href = "./login.html";
}

function formatarData(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    timeZone: "UTC"
  });
}

function formatarDataInput(data) {
  if (!data) return "";
  return new Date(data).toISOString().split("T")[0];
}

function traduzirTipoParticipante(tipo) {
  const mapa = {
    DUPLA: "Dupla",
    TIME: "Quarteto"
  };

  return mapa[tipo] || tipo;
}

function traduzirFormato(formato) {
  const mapa = {
    MATA_MATA: "Mata-mata",
    DUPLA_ELIMINACAO: "Upper/Lower",
    TODOS_CONTRA_TODOS: "Todos contra todos"
  };

  return mapa[formato] || formato;
}

function traduzirFase(fase) {
  const mapa = {
    SEMIFINAL_1: "Semifinal 1",
    SEMIFINAL_2: "Semifinal 2",
    FINAL: "Final",
    TERCEIRO_LUGAR: "3º Lugar",
    PRIMEIRA_FASE_1: "Primeira fase 1",
    PRIMEIRA_FASE_2: "Primeira fase 2",
    PRIMEIRA_FASE_3: "Primeira fase 3",
    PRIMEIRA_FASE_4: "Primeira fase 4",
    QUARTAS_1: "Quartas 1",
    QUARTAS_2: "Quartas 2",
    QUARTAS_3: "Quartas 3",
    QUARTAS_4: "Quartas 4",
    OITAVAS_1: "Oitavas 1",
    OITAVAS_2: "Oitavas 2",
    OITAVAS_3: "Oitavas 3",
    OITAVAS_4: "Oitavas 4",
    OITAVAS_5: "Oitavas 5",
    OITAVAS_6: "Oitavas 6",
    OITAVAS_7: "Oitavas 7",
    OITAVAS_8: "Oitavas 8"
  };

  return mapa[fase] || fase.replaceAll("_", " ");
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
  return resumo.totais.participantes >= quantidadeMinimaParaChaveamento();
}

function obterBaseFase(fase) {
  if (fase === "FINAL") return "FINAL";
  if (fase === "TERCEIRO_LUGAR") return "TERCEIRO_LUGAR";
  if (fase.startsWith("PRIMEIRA_FASE")) return "PRIMEIRA_FASE";
  if (fase.startsWith("OITAVAS")) return "OITAVAS";
  if (fase.startsWith("QUARTAS")) return "QUARTAS";
  if (fase.startsWith("SEMIFINAL")) return "SEMIFINAL";

  const match = fase.match(/^(.*)_\d+$/);
  if (match) return match[1];

  return fase;
}

function obterTituloGrupoFase(baseFase) {
  const mapa = {
    PRIMEIRA_FASE: "Primeira fase",
    OITAVAS: "Oitavas",
    QUARTAS: "Quartas de final",
    SEMIFINAL: "Semifinais",
    FINAL: "Final",
    TERCEIRO_LUGAR: "3º Lugar"
  };

  return mapa[baseFase] || baseFase.replaceAll("_", " ");
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

  return "Campeonato pronto para gerar chaveamento.";
}

function atualizarEstadoBotoes(resumo) {
  const inscricoesFechadas = !resumo.campeonato.inscricoesAbertas;
  const jaTemJogos = resumo.jogos.length > 0;
  const finalizado = resumo.statusCampeonato === "FINALIZADO";
  const podeGerar = quantidadeValidaParaGerarChaveamento(resumo);

  botaoEncerrar.disabled = inscricoesFechadas || finalizado;

  if (botaoReabrir) {
    botaoReabrir.disabled = !inscricoesFechadas || jaTemJogos || finalizado;
  }

  botaoChaveamento.disabled =
    jaTemJogos ||
    finalizado ||
    resumo.campeonato.inscricoesAbertas ||
    !podeGerar;
}

function renderizarFormularioEdicaoCampeonato(resumo) {
  const campeonato = resumo.campeonato;
  const possuiInscritos = resumo.totais.participantes > 0;
  const minimoQuantidade = Math.max(1, resumo.totais.participantes);

  return `
    <div class="area-edicao-campeonato">
      <h4>Editar campeonato</h4>

      ${
        possuiInscritos
          ? `
            <p class="info-auxiliar">
              Como já existem participantes inscritos, os campos Tipo, Categoria e Formato não podem mais ser alterados.
            </p>
          `
          : ""
      }

      <form id="form-edicao-campeonato" class="formulario-edicao-campeonato">
        <div class="grupo-formulario">
          <label>Nome</label>
          <input type="text" name="nome" value="${campeonato.nome}" required />
        </div>

        <div class="grupo-formulario">
          <label>Data</label>
          <input type="date" name="data" value="${formatarDataInput(campeonato.data)}" />
        </div>

        <div class="grupo-formulario">
          <label>Local</label>
          <input type="text" name="local" value="${campeonato.local || ""}" />
        </div>

        <div class="grupo-formulario">
          <label>Tipo</label>
          <select name="tipoParticipante" ${possuiInscritos ? "disabled" : ""} required>
            <option value="DUPLA" ${campeonato.tipoParticipante === "DUPLA" ? "selected" : ""}>Dupla</option>
            <option value="TIME" ${campeonato.tipoParticipante === "TIME" ? "selected" : ""}>Quarteto</option>
          </select>
        </div>

        <div class="grupo-formulario">
          <label>Categoria</label>
          <select name="categoria" ${possuiInscritos ? "disabled" : ""} required>
            <option value="MASCULINO" ${campeonato.categoria === "MASCULINO" ? "selected" : ""}>Masculino</option>
            <option value="FEMININO" ${campeonato.categoria === "FEMININO" ? "selected" : ""}>Feminino</option>
            <option value="MISTA" ${campeonato.categoria === "MISTA" ? "selected" : ""}>Mista</option>
          </select>
        </div>

        <div class="grupo-formulario">
          <label>Formato</label>
          <select name="formato" ${possuiInscritos ? "disabled" : ""} required>
            <option value="MATA_MATA" ${campeonato.formato === "MATA_MATA" ? "selected" : ""}>Mata-mata</option>
            <option value="DUPLA_ELIMINACAO" ${campeonato.formato === "DUPLA_ELIMINACAO" ? "selected" : ""}>Upper/Lower</option>
            <option value="TODOS_CONTRA_TODOS" ${campeonato.formato === "TODOS_CONTRA_TODOS" ? "selected" : ""}>Todos contra todos</option>
          </select>
        </div>

        <div class="grupo-formulario">
          <label>Quantidade máxima</label>
          <input
            type="number"
            name="quantidadeMaxima"
            min="${minimoQuantidade}"
            value="${campeonato.quantidadeMaxima ?? ""}"
          />
        </div>

        <div class="acoes-card">
          <button type="submit" class="botao-pequeno">Salvar campeonato</button>
          <button type="button" id="botao-cancelar-edicao-campeonato" class="botao-pequeno secundario">
            Cancelar
          </button>
        </div>

        <p id="mensagem-edicao-campeonato" class="mensagem-edicao-inscricao"></p>
      </form>
    </div>
  `;
}

function renderizarResumo(resumo) {
  const campeonato = resumo.campeonato;
  const textoStatus = traduzirStatusCampeonato(resumo.statusCampeonato);
  const classeStatus = classeStatusCampeonato(resumo.statusCampeonato);
  const mensagemChaveamento = mensagemApoioChaveamento(resumo);
  const podeEditarCampeonato = resumo.jogos.length === 0;

  dadosCampeonato.innerHTML = `
    <div class="bloco-informacoes">
      <p><strong>Nome:</strong> ${campeonato.nome}</p>
      <p><strong>Data:</strong> ${formatarData(campeonato.data)}</p>
      <p><strong>Local:</strong> ${campeonato.local || "Não informado"}</p>
      <p><strong>Tipo:</strong> ${traduzirTipoParticipante(campeonato.tipoParticipante)}</p>
      <p><strong>Categoria:</strong> ${campeonato.categoria}</p>
      <p><strong>Formato:</strong> ${traduzirFormato(campeonato.formato)}</p>
      <p><strong>Quantidade máxima:</strong> ${campeonato.quantidadeMaxima ?? "Não definida"}</p>
      <p><strong>Inscrições abertas:</strong> ${campeonato.inscricoesAbertas ? "Sim" : "Não"}</p>
      <p><strong>Total de participantes:</strong> ${resumo.totais.participantes}</p>
      <p><strong>Total de jogos:</strong> ${resumo.totais.jogos}</p>
      <p><strong>Jogos finalizados:</strong> ${resumo.totais.jogosFinalizados}</p>
      <span class="status-badge ${classeStatus}">${textoStatus}</span>
      <p class="info-auxiliar">Use o botão de copiar link para enviar a página pública de inscrição aos participantes.</p>
      <p class="info-auxiliar"><strong>Chaveamento:</strong> ${mensagemChaveamento}</p>

      ${
        podeEditarCampeonato
          ? `
            <div class="acoes-card" style="margin-top: 16px;">
              <button id="botao-editar-campeonato" class="botao-pequeno" type="button">
                Editar campeonato
              </button>
            </div>
          `
          : `
            <p class="info-auxiliar">
              A edição do campeonato fica indisponível após gerar o chaveamento.
            </p>
          `
      }

      ${campeonatoEmEdicao && podeEditarCampeonato ? renderizarFormularioEdicaoCampeonato(resumo) : ""}
    </div>
  `;

  if (podeEditarCampeonato) {
    conectarEventosEdicaoCampeonato();
    conectarFormularioEdicaoCampeonato();
    conectarCancelarEdicaoCampeonato();
  }
}

function renderizarFormularioEdicao(participante) {
  return `
    <form class="formulario-edicao-inscricao" data-form-edicao-id="${participante.id}">
      <div class="grupo-formulario">
        <label>Nome da equipe</label>
        <input
          type="text"
          name="nomeEquipe"
          value="${participante.nomeEquipe}"
          required
        />
      </div>

      <div class="grupo-formulario">
        <label>Capitã(o)</label>
        <input
          type="text"
          name="responsavel"
          value="${participante.responsavel}"
          required
        />
      </div>

      <div class="grupo-formulario">
        <label>Telefone para contato</label>
        <input
          type="tel"
          name="contato"
          value="${participante.contato || ""}"
          placeholder="(83) 99999-9999"
        />
      </div>

      <div class="bloco-jogadores-edicao">
        ${participante.jogadores
          .map(
            (jogador, index) => `
              <div class="card-jogador">
                <h4>Jogador ${index + 1}</h4>

                <div class="grupo-formulario">
                  <label>Nome</label>
                  <input
                    type="text"
                    name="jogador-nome-${index}"
                    value="${jogador.nome}"
                    required
                  />
                </div>

                <div class="grupo-formulario">
                  <label>Gênero</label>
                  <select name="jogador-genero-${index}" required>
                    <option value="M" ${jogador.genero === "M" ? "selected" : ""}>Masculino</option>
                    <option value="F" ${jogador.genero === "F" ? "selected" : ""}>Feminino</option>
                  </select>
                </div>
              </div>
            `
          )
          .join("")}
      </div>

      <div class="acoes-card">
        <button type="submit" class="botao-pequeno">Salvar alterações</button>
        <button
          type="button"
          class="botao-pequeno secundario"
          data-cancelar-edicao-id="${participante.id}"
        >
          Cancelar
        </button>
      </div>

      <p class="mensagem-edicao-inscricao" id="mensagem-edicao-${participante.id}"></p>
    </form>
  `;
}

function renderizarParticipantes(participantes) {
  if (!participantes.length) {
    listaParticipantes.innerHTML = "<p>Nenhum participante inscrito.</p>";
    return;
  }

  const podeEditarOuExcluir = resumoAtual ? resumoAtual.jogos.length === 0 : false;

  listaParticipantes.innerHTML = `
    <div class="lista-simples">
      ${participantes
        .map((participante) => {
          const estaEditando = inscricaoEmEdicaoId === participante.id;

          return `
            <div class="item-lista">
              <h3>${participante.nomeEquipe}</h3>
              <p><strong>Capitã(o):</strong> ${participante.responsavel}</p>
              <p><strong>Telefone:</strong> ${participante.contato || "Não informado"}</p>
              <p><strong>Status:</strong> ${participante.statusInscricao}</p>
              <ul>
                ${participante.jogadores
                  .map((jogador) => `<li>${jogador.nome} (${jogador.genero})</li>`)
                  .join("")}
              </ul>

              ${
                podeEditarOuExcluir
                  ? `
                    <div class="acoes-card">
                      <button
                        class="botao-pequeno"
                        data-editar-inscricao-id="${participante.id}"
                      >
                        Editar inscrição
                      </button>

                      <button
                        class="botao-pequeno botao-excluir"
                        data-inscricao-id="${participante.id}"
                      >
                        Excluir inscrição
                      </button>
                    </div>
                  `
                  : `
                    <p class="info-auxiliar">
                      A edição e exclusão de inscrição ficam indisponíveis após gerar o chaveamento.
                    </p>
                  `
              }

              ${
                estaEditando && podeEditarOuExcluir
                  ? `
                    <div class="area-edicao-inscricao">
                      <h4>Editar inscrição</h4>
                      ${renderizarFormularioEdicao(participante)}
                    </div>
                  `
                  : ""
              }
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  if (podeEditarOuExcluir) {
    conectarEventosEdicaoInscricao();
    conectarEventosFormularioEdicaoInscricao();
    conectarEventosCancelarEdicaoInscricao();
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

function conectarEventosEdicaoCampeonato() {
  const botao = document.getElementById("botao-editar-campeonato");

  if (!botao) return;

  botao.addEventListener("click", () => {
    campeonatoEmEdicao = true;
    renderizarResumo(resumoAtual);
    mensagemCampeonato.textContent = "";
  });
}

function conectarFormularioEdicaoCampeonato() {
  const form = document.getElementById("form-edicao-campeonato");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const mensagemEdicao = document.getElementById("mensagem-edicao-campeonato");

    try {
      mensagemEdicao.textContent = "Salvando campeonato...";

      const quantidadeMaximaValor = form.querySelector('[name="quantidadeMaxima"]').value
        ? Number(form.querySelector('[name="quantidadeMaxima"]').value)
        : null;

      if (
        quantidadeMaximaValor !== null &&
        quantidadeMaximaValor < resumoAtual.totais.participantes
      ) {
        mensagemEdicao.textContent =
          `Erro: a quantidade máxima não pode ser menor que o total atual de inscritos (${resumoAtual.totais.participantes}).`;
        return;
      }

      await atualizarCampeonato(campeonatoId, {
        nome: form.querySelector('[name="nome"]').value.trim(),
        data: form.querySelector('[name="data"]').value || null,
        local: form.querySelector('[name="local"]').value.trim() || null,
        tipoParticipante: resumoAtual.totais.participantes > 0
          ? resumoAtual.campeonato.tipoParticipante
          : form.querySelector('[name="tipoParticipante"]').value,
        categoria: resumoAtual.totais.participantes > 0
          ? resumoAtual.campeonato.categoria
          : form.querySelector('[name="categoria"]').value,
        formato: resumoAtual.totais.participantes > 0
          ? resumoAtual.campeonato.formato
          : form.querySelector('[name="formato"]').value,
        quantidadeMaxima: quantidadeMaximaValor
      });

      campeonatoEmEdicao = false;
      await carregarResumo(false);
      mensagemCampeonato.textContent = "Campeonato atualizado com sucesso.";
    } catch (error) {
      mensagemEdicao.textContent = `Erro: ${error.message}`;
    }
  });
}

function conectarCancelarEdicaoCampeonato() {
  const botao = document.getElementById("botao-cancelar-edicao-campeonato");

  if (!botao) return;

  botao.addEventListener("click", () => {
    campeonatoEmEdicao = false;
    renderizarResumo(resumoAtual);
    mensagemCampeonato.textContent = "Edição do campeonato cancelada.";
  });
}

function conectarEventosEdicaoInscricao() {
  const botoes = document.querySelectorAll("[data-editar-inscricao-id]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      inscricaoEmEdicaoId = Number(botao.dataset.editarInscricaoId);
      renderizarParticipantes(resumoAtual.participantes);
      mensagemCampeonato.textContent = "";
    });
  });
}

function conectarEventosFormularioEdicaoInscricao() {
  const formularios = document.querySelectorAll("[data-form-edicao-id]");

  formularios.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const inscricaoId = Number(form.dataset.formEdicaoId);
      const mensagemEdicao = document.getElementById(`mensagem-edicao-${inscricaoId}`);

      const participante = resumoAtual?.participantes?.find(
        (item) => item.id === inscricaoId
      );

      if (!participante) {
        mensagemEdicao.textContent = "Inscrição não encontrada para edição.";
        return;
      }

      const jogadores = participante.jogadores.map((_, index) => ({
        nome: form.querySelector(`[name="jogador-nome-${index}"]`).value.trim(),
        genero: form.querySelector(`[name="jogador-genero-${index}"]`).value
      }));

      try {
        mensagemEdicao.textContent = "Atualizando inscrição...";

        await atualizarInscricao(inscricaoId, {
          nomeEquipe: form.querySelector('[name="nomeEquipe"]').value.trim(),
          responsavel: form.querySelector('[name="responsavel"]').value.trim(),
          contato: form.querySelector('[name="contato"]').value.trim() || null,
          jogadores
        });

        inscricaoEmEdicaoId = null;
        await carregarResumo(false);
        mensagemCampeonato.textContent = "Inscrição atualizada com sucesso.";
      } catch (error) {
        mensagemEdicao.textContent = `Erro: ${error.message}`;
      }
    });
  });
}

function conectarEventosCancelarEdicaoInscricao() {
  const botoes = document.querySelectorAll("[data-cancelar-edicao-id]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      inscricaoEmEdicaoId = null;
      renderizarParticipantes(resumoAtual.participantes);
      mensagemCampeonato.textContent = "Edição cancelada.";
    });
  });
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

function agruparJogosPorColunaMataMata(jogos) {
  const grupos = new Map();

  jogos.forEach((jogo) => {
    const baseFase = obterBaseFase(jogo.fase);

    if (!grupos.has(baseFase)) {
      grupos.set(baseFase, []);
    }

    grupos.get(baseFase).push(jogo);
  });

  const ordem = [
    "PRIMEIRA_FASE",
    "OITAVAS",
    "QUARTAS",
    "SEMIFINAL",
    "FINAL",
    "TERCEIRO_LUGAR"
  ];

  return Array.from(grupos.entries()).sort((a, b) => {
    const indiceA = ordem.indexOf(a[0]);
    const indiceB = ordem.indexOf(b[0]);

    const valorA = indiceA === -1 ? 999 : indiceA;
    const valorB = indiceB === -1 ? 999 : indiceB;

    return valorA - valorB;
  });
}

function renderizarChaveMataMata(jogos) {
  const colunas = agruparJogosPorColunaMataMata(jogos);

  if (!colunas.length) {
    chaveCampeonato.innerHTML = "<p>Nenhum jogo gerado ainda.</p>";
    return;
  }

  chaveCampeonato.innerHTML = `
    <div class="chave-grid">
      ${colunas
        .map(
          ([baseFase, lista]) => `
            <div class="coluna-chave">
              <h3>${obterTituloGrupoFase(baseFase)}</h3>
              ${lista
                .map((jogo) => {
                  const equipeA = jogo.equipeA?.nomeEquipe || "A definir";
                  const equipeB = jogo.equipeB?.nomeEquipe || "A definir";
                  const vencedorId = jogo.vencedorId;

                  return `
                    <div class="jogo-chave">
                      <div class="fase-status">${jogo.status}</div>

                      <div class="linha-equipe ${
                        jogo.equipeAId && vencedorId === jogo.equipeAId
                          ? "vencedor-chave"
                          : ""
                      }">
                        ${equipeA}
                      </div>

                      <div class="linha-equipe ${
                        jogo.equipeBId && vencedorId === jogo.equipeBId
                          ? "vencedor-chave"
                          : ""
                      }">
                        ${equipeB}
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

function renderizarChave(resumo) {
  if (resumo.campeonato.formato !== "MATA_MATA") {
    chaveCampeonato.innerHTML =
      "<p>A visualização de chave para este formato será adicionada em breve.</p>";
    return;
  }

  renderizarChaveMataMata(resumo.jogos);
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
    renderizarChave(resumo);
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

botaoReabrir.addEventListener("click", async () => {
  try {
    mensagemCampeonato.textContent = "Reabrindo inscrições...";
    await reabrirInscricoes(campeonatoId);
    await carregarResumo(false);
    mensagemCampeonato.textContent = "Inscrições reabertas com sucesso.";
  } catch (error) {
    mensagemCampeonato.textContent = `Erro ao reabrir inscrições: ${error.message}`;
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