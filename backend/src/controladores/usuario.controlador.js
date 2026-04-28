import usuarioServico from "../servicos/usuario.servico.js";

async function cadastro(req, res) {
  try {
    const { nome, email, contato, senha, dataNascimento } = req.body;

    if (!nome || !email || !contato || !senha || !dataNascimento) {
      return res.status(400).json({
        erro: "Nome, e-mail, contato, senha e data de nascimento são obrigatórios."
      });
    }

    const usuario = await usuarioServico.cadastrarParticipante({
      nome,
      email,
      contato,
      senha,
      dataNascimento
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

async function perfil(req, res) {
  try {
    const usuario = await usuarioServico.buscarPerfil(req.usuario.id);
    return res.json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizarFotoPerfil(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        erro: "Nenhuma imagem enviada."
      });
    }

    const usuario = await usuarioServico.atualizarFotoPerfil(
      req.usuario.id,
      req.file.filename
    );

    return res.json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

async function atualizarPerfil(req, res) {
  try {
    const { nome, contato, dataNascimento } = req.body;

    if (!nome || !contato || !dataNascimento) {
      return res.status(400).json({
        erro: "Nome, contato e data de nascimento são obrigatórios."
      });
    }

    const usuario = await usuarioServico.atualizarPerfil(req.usuario.id, {
      nome,
      contato,
      dataNascimento
    });

    return res.json(usuario);
  } catch (error) {
    return res.status(400).json({
      erro: error.message
    });
  }
}

export default {
  cadastro,
  login,
  minhasInscricoes,
  perfil,
  atualizarPerfil,
  atualizarFotoPerfil
};