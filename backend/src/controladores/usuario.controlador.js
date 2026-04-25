import usuarioServico from "../servicos/usuario.servico.js";

async function cadastro(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, e-mail e senha são obrigatórios."
      });
    }

    const usuario = await usuarioServico.cadastrarParticipante({
      nome,
      email,
      senha
    });

    return res.status(201).json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        erro: "E-mail e senha são obrigatórios."
      });
    }

    const resultado = await usuarioServico.loginUsuario({
      email,
      senha
    });

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function minhasInscricoes(req, res) {
  try {
    const inscricoes = await usuarioServico.listarMinhasInscricoes(req.usuario.id);
    return res.json(inscricoes);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  cadastro,
  login,
  minhasInscricoes
};