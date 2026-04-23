import authServico from "../servicos/auth.servico.js";

async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        erro: "Nome, e-mail e senha são obrigatórios."
      });
    }

    const organizador = await authServico.cadastrar({
      nome,
      email,
      senha
    });

    return res.status(201).json(organizador);
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

    const resultado = await authServico.login({
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

export default {
  cadastrar,
  login
};