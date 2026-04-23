import { cadastrarOrganizador, loginOrganizador } from "./api.js";

const abaLogin = document.getElementById("aba-login");
const abaCadastro = document.getElementById("aba-cadastro");
const formLogin = document.getElementById("form-login");
const formCadastro = document.getElementById("form-cadastro");
const mensagemAuth = document.getElementById("mensagem-auth");

function mostrarLogin() {
  formLogin.classList.remove("oculto");
  formCadastro.classList.add("oculto");

  abaLogin.classList.remove("secundario");
  abaLogin.classList.add("aba-ativa");

  abaCadastro.classList.add("secundario");
  abaCadastro.classList.remove("aba-ativa");

  mensagemAuth.textContent = "";
}

function mostrarCadastro() {
  formCadastro.classList.remove("oculto");
  formLogin.classList.add("oculto");

  abaCadastro.classList.remove("secundario");
  abaCadastro.classList.add("aba-ativa");

  abaLogin.classList.add("secundario");
  abaLogin.classList.remove("aba-ativa");

  mensagemAuth.textContent = "";
}

function salvarSessao(resultadoLogin) {
  localStorage.setItem("tokenOrganizador", resultadoLogin.token);
  localStorage.setItem(
    "organizadorLogado",
    JSON.stringify(resultadoLogin.organizador)
  );
}

abaLogin.addEventListener("click", mostrarLogin);
abaCadastro.addEventListener("click", mostrarCadastro);

formCadastro.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagemAuth.textContent = "Cadastrando organizador...";

  const formData = new FormData(formCadastro);

  const dados = {
    nome: formData.get("nome"),
    email: formData.get("email"),
    senha: formData.get("senha")
  };

  try {
    await cadastrarOrganizador(dados);
    mensagemAuth.textContent =
      "Cadastro realizado com sucesso. Agora faça login.";
    formCadastro.reset();
    mostrarLogin();
  } catch (error) {
    mensagemAuth.textContent = `Erro no cadastro: ${error.message}`;
  }
});

formLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  mensagemAuth.textContent = "Entrando...";

  const formData = new FormData(formLogin);

  const dados = {
    email: formData.get("email"),
    senha: formData.get("senha")
  };

  try {
    const resultado = await loginOrganizador(dados);
    salvarSessao(resultado);
    mensagemAuth.textContent = "Login realizado com sucesso.";
    window.location.href = "./inicio.html";
  } catch (error) {
    mensagemAuth.textContent = `Erro no login: ${error.message}`;
  }
});

mostrarLogin();