import { cadastrarParticipante, loginParticipante } from "./api.js";

const abaLoginParticipante = document.getElementById("aba-login-participante");
const abaCadastroParticipante = document.getElementById("aba-cadastro-participante");
const formLoginParticipante = document.getElementById("form-login-participante");
const formCadastroParticipante = document.getElementById("form-cadastro-participante");
const mensagemParticipante = document.getElementById("mensagem-participante");

function mostrarLoginParticipante() {
  formLoginParticipante.classList.remove("oculto");
  formCadastroParticipante.classList.add("oculto");

  abaLoginParticipante.classList.remove("secundario");
  abaLoginParticipante.classList.add("aba-ativa");

  abaCadastroParticipante.classList.add("secundario");
  abaCadastroParticipante.classList.remove("aba-ativa");

  mensagemParticipante.textContent = "";
}

function mostrarCadastroParticipante() {
  formCadastroParticipante.classList.remove("oculto");
  formLoginParticipante.classList.add("oculto");

  abaCadastroParticipante.classList.remove("secundario");
  abaCadastroParticipante.classList.add("aba-ativa");

  abaLoginParticipante.classList.add("secundario");
  abaLoginParticipante.classList.remove("aba-ativa");

  mensagemParticipante.textContent = "";
}

function salvarSessaoParticipante(resultadoLogin) {
  localStorage.setItem("tokenParticipante", resultadoLogin.token);
  localStorage.setItem(
    "participanteLogado",
    JSON.stringify(resultadoLogin.usuario)
  );
}

abaLoginParticipante.addEventListener("click", mostrarLoginParticipante);
abaCadastroParticipante.addEventListener("click", mostrarCadastroParticipante);

formCadastroParticipante.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagemParticipante.textContent = "Cadastrando participante...";

  const formData = new FormData(formCadastroParticipante);

  const dados = {
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha")
  };

  try {
    await cadastrarParticipante(dados);
    mensagemParticipante.textContent =
      "Cadastro realizado com sucesso. Agora faça login.";
    formCadastroParticipante.reset();
    mostrarLoginParticipante();
  } catch (error) {
    mensagemParticipante.textContent = `Erro no cadastro: ${error.message}`;
  }
});

formLoginParticipante.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagemParticipante.textContent = "Entrando...";

  const formData = new FormData(formLoginParticipante);

  const dados = {
    email: formData.get("email"),
    senha: formData.get("senha")
  };

  try {
    const resultado = await loginParticipante(dados);
    salvarSessaoParticipante(resultado);
    mensagemParticipante.textContent = "Login realizado com sucesso.";
    window.location.href = "./campeonatos-publicos.html";
  } catch (error) {
    mensagemParticipante.textContent = `Erro no login: ${error.message}`;
  }
});

mostrarLoginParticipante();