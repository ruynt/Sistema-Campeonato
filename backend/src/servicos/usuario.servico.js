import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

async function cadastrarParticipante({ nome, email, senha }) {
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
      senhaHash,
      papel: "PARTICIPANTE"
    }
  });

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
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

export default {
  cadastrarParticipante,
  loginUsuario,
  listarMinhasInscricoes
};