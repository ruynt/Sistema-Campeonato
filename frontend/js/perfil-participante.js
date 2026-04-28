import {
  buscarPerfilParticipante,
  atualizarPerfilParticipante,
  atualizarFotoPerfilParticipante
} from "./api.js";

const perfilParticipanteBox = document.getElementById("perfil-participante-box");
const mensagemPerfilParticipante = document.getElementById("mensagem-perfil-participante");
const botaoLogoutParticipante = document.getElementById("botao-logout-participante");

let usuarioAtual = null;
let modoEdicao = false;
let arquivoFotoSelecionado = null;

function obterTokenParticipante() {
  return localStorage.getItem("tokenParticipante");
}

function protegerPaginaParticipante() {
  if (!obterTokenParticipante()) {
    window.location.href = "./participante.html";
  }
}

function sairParticipante() {
  localStorage.removeItem("tokenParticipante");
  localStorage.removeItem("participanteLogado");
  window.location.href = "./campeonatos-publicos.html";
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

function formatarAniversario(data) {
  if (!data) return "Não informada";

  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC"
  });
}

function formatarTelefone(contato) {
  if (!contato) return "Não informado";

  const numeros = contato.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }

  if (numeros.length === 10) {
    return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }

  return contato;
}

function aplicarMascaraTelefone(valor) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function somenteNumeros(valor) {
  return valor.replace(/\D/g, "");
}

function obterUrlFoto(fotoPerfil) {
  if (!fotoPerfil) return "";

  if (fotoPerfil.startsWith("http://") || fotoPerfil.startsWith("https://")) {
    return fotoPerfil;
  }

  return `http://localhost:3333${fotoPerfil}`;
}

function renderizarPerfilVisualizacao(usuario) {
  const foto = usuario.fotoPerfil
    ? `<img src="${obterUrlFoto(usuario.fotoPerfil)}" alt="Foto de perfil" class="foto-perfil-participante" />`
    : `<div class="foto-perfil-placeholder">Sem foto</div>`;

  perfilParticipanteBox.innerHTML = `
    <div class="perfil-participante-card">
      <div class="perfil-participante-topo">
        ${foto}
      </div>

      <div class="bloco-informacoes">
        <p><strong>Nome:</strong> ${usuario.nome}</p>
        <p><strong>E-mail:</strong> ${usuario.email}</p>
        <p><strong>Contato:</strong> ${formatarTelefone(usuario.contato)}</p>
        <p><strong>Data de aniversário:</strong> ${formatarAniversario(usuario.dataNascimento)}</p>
        <p><strong>Conta criada em:</strong> ${formatarData(usuario.criadoEm)}</p>
      </div>

      <div class="acoes-card">
        <button id="botao-editar-perfil" class="botao-pequeno" type="button">
          Editar perfil
        </button>
      </div>
    </div>
  `;

  const botaoEditarPerfil = document.getElementById("botao-editar-perfil");

  if (botaoEditarPerfil) {
    botaoEditarPerfil.addEventListener("click", () => {
      modoEdicao = true;
      arquivoFotoSelecionado = null;
      renderizarPerfil();
      mensagemPerfilParticipante.textContent = "";
    });
  }
}

function renderizarPerfilEdicao(usuario) {
  const foto = usuario.fotoPerfil
    ? `<img src="${obterUrlFoto(usuario.fotoPerfil)}" alt="Foto de perfil" class="foto-perfil-participante" />`
    : `<div class="foto-perfil-placeholder">Clique para adicionar foto</div>`;

  perfilParticipanteBox.innerHTML = `
    <div class="perfil-participante-card">
      <div class="perfil-participante-topo">
        <label for="input-foto-perfil-edicao" class="foto-perfil-clicavel" title="Clique para trocar a foto">
          ${foto}
          <span class="texto-acao-foto-inline">Clique na foto para trocar</span>
        </label>
        <input
          type="file"
          id="input-foto-perfil-edicao"
          accept=".jpg,.jpeg,.png,.webp"
          class="oculto"
        />
      </div>

      <form id="form-edicao-perfil" class="formulario-edicao-campeonato">
        <div class="grupo-formulario">
          <label for="perfil-nome">Nome</label>
          <input type="text" id="perfil-nome" name="nome" value="${usuario.nome}" required />
        </div>

        <div class="grupo-formulario">
          <label for="perfil-contato">Contato</label>
          <input
            type="tel"
            id="perfil-contato"
            name="contato"
            value="${formatarTelefone(usuario.contato || "")}"
            maxlength="15"
            inputmode="numeric"
            required
          />
        </div>

        <div class="grupo-formulario">
          <label for="perfil-dataNascimento">Data de aniversário</label>
          <input
            type="date"
            id="perfil-dataNascimento"
            name="dataNascimento"
            value="${formatarDataInput(usuario.dataNascimento)}"
            required
          />
        </div>

        <div class="acoes-card">
          <button type="submit" class="botao-pequeno">Salvar alterações</button>
          <button type="button" id="botao-cancelar-edicao-perfil" class="botao-pequeno secundario">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  `;

  const campoContato = document.getElementById("perfil-contato");
  const formEdicao = document.getElementById("form-edicao-perfil");
  const botaoCancelar = document.getElementById("botao-cancelar-edicao-perfil");
  const inputFoto = document.getElementById("input-foto-perfil-edicao");

  if (campoContato) {
    campoContato.addEventListener("input", (event) => {
      event.target.value = aplicarMascaraTelefone(event.target.value);
    });
  }

  if (inputFoto) {
    inputFoto.addEventListener("change", () => {
      const arquivo = inputFoto.files[0];
      if (!arquivo) return;

      arquivoFotoSelecionado = arquivo;

      const urlTemporaria = URL.createObjectURL(arquivo);
      const fotoEl = document.querySelector(".foto-perfil-clicavel img");
      const placeholderEl = document.querySelector(".foto-perfil-clicavel .foto-perfil-placeholder");

      if (fotoEl) {
        fotoEl.src = urlTemporaria;
      } else if (placeholderEl) {
        placeholderEl.outerHTML = `<img src="${urlTemporaria}" alt="Foto de perfil" class="foto-perfil-participante" />`;
      }

      mensagemPerfilParticipante.textContent = "Nova foto selecionada. Agora clique em Salvar alterações.";
    });
  }

  if (botaoCancelar) {
    botaoCancelar.addEventListener("click", () => {
      modoEdicao = false;
      arquivoFotoSelecionado = null;
      renderizarPerfil();
      mensagemPerfilParticipante.textContent = "Edição cancelada.";
    });
  }

  if (formEdicao) {
    formEdicao.addEventListener("submit", async (event) => {
      event.preventDefault();

      try {
        mensagemPerfilParticipante.textContent = "Salvando alterações...";

        const nome = document.getElementById("perfil-nome").value.trim();
        const contato = somenteNumeros(document.getElementById("perfil-contato").value.trim());
        const dataNascimento = document.getElementById("perfil-dataNascimento").value;

        let usuarioAtualizado = await atualizarPerfilParticipante({
          nome,
          contato,
          dataNascimento
        });

        if (arquivoFotoSelecionado) {
          usuarioAtualizado = await atualizarFotoPerfilParticipante(arquivoFotoSelecionado);
        }

        usuarioAtual = {
          ...usuarioAtual,
          ...usuarioAtualizado,
          nome,
          contato,
          dataNascimento
        };

        localStorage.setItem("participanteLogado", JSON.stringify(usuarioAtual));

        modoEdicao = false;
        arquivoFotoSelecionado = null;
        renderizarPerfil();
        mensagemPerfilParticipante.textContent = "Perfil atualizado com sucesso.";
      } catch (error) {
        mensagemPerfilParticipante.textContent = `Erro ao atualizar perfil: ${error.message}`;
      }
    });
  }
}

function renderizarPerfil() {
  if (!usuarioAtual) return;

  if (modoEdicao) {
    renderizarPerfilEdicao(usuarioAtual);
    return;
  }

  renderizarPerfilVisualizacao(usuarioAtual);
}

async function carregarPerfil() {
  try {
    mensagemPerfilParticipante.textContent = "Carregando perfil...";
    usuarioAtual = await buscarPerfilParticipante();
    renderizarPerfil();
    mensagemPerfilParticipante.textContent = "";
  } catch (error) {
    mensagemPerfilParticipante.textContent = `Erro ao carregar perfil: ${error.message}`;
  }
}

botaoLogoutParticipante.addEventListener("click", sairParticipante);

protegerPaginaParticipante();
carregarPerfil();