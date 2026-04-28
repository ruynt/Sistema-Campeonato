import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

async function cadastrarParticipante({
  nome,
  email,
  contato,
  senha,
  dataNascimento
}) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email }
  });

  if (usuarioExistente) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const usuario = await prisma.usuario.create({
    data: {
      nome,
      email,
      contato,
      dataNascimento: new Date(dataNascimento),
      senhaHash,
      papel: "PARTICIPANTE"
    }
  });

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    contato: usuario.contato,
    dataNascimento: usuario.dataNascimento,
    fotoPerfil: usuario.fotoPerfil,
    papel: usuario.papel
  };
}

async function loginUsuario({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({
    where: { email }
  });

  if (!usuario) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const senhaCorreta = await bcrypt.compare(senha, usuario.senhaHash);

  if (!senhaCorreta) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const token = jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      papel: usuario.papel
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      contato: usuario.contato,
      dataNascimento: usuario.dataNascimento,
      fotoPerfil: usuario.fotoPerfil,
      papel: usuario.papel
    }
  };
}

async function listarMinhasInscricoes(usuarioId) {
  return prisma.participante.findMany({
    where: {
      usuarioId: Number(usuarioId)
    },
    include: {
      jogadores: true,
      campeonato: true
    },
    orderBy: {
      criadoEm: "desc"
    }
  });
}

async function buscarPerfil(usuarioId) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    },
    select: {
      id: true,
      nome: true,
      email: true,
      contato: true,
      dataNascimento: true,
      fotoPerfil: true,
      papel: true,
      criadoEm: true
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  return usuario;
}

async function atualizarFotoPerfil(usuarioId, nomeArquivo) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  const fotoPerfil = `/uploads/perfis/${nomeArquivo}`;

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: Number(usuarioId)
    },
    data: {
      fotoPerfil
    },
    select: {
      id: true,
      nome: true,
      email: true,
      contato: true,
      dataNascimento: true,
      fotoPerfil: true,
      papel: true,
      criadoEm: true
    }
  });

  return usuarioAtualizado;
}

async function atualizarPerfil(usuarioId, { nome, contato, dataNascimento }) {
  const usuario = await prisma.usuario.findUnique({
    where: {
      id: Number(usuarioId)
    }
  });

  if (!usuario) {
    throw new Error("Usuário não encontrado.");
  }

  const usuarioAtualizado = await prisma.usuario.update({
    where: {
      id: Number(usuarioId)
    },
    data: {
      nome,
      contato,
      dataNascimento: new Date(dataNascimento)
    },
    select: {
      id: true,
      nome: true,
      email: true,
      contato: true,
      dataNascimento: true,
      fotoPerfil: true,
      papel: true,
      criadoEm: true
    }
  });

  return usuarioAtualizado;
}

export default {
  cadastrarParticipante,
  loginUsuario,
  listarMinhasInscricoes,
  buscarPerfil,
  atualizarPerfil,
  atualizarFotoPerfil
};