import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

async function cadastrar({ nome, email, senha }) {
  const organizadorExistente = await prisma.organizador.findUnique({
    where: {
      email
    }
  });

  if (organizadorExistente) {
    throw new Error("Já existe um organizador com esse e-mail.");
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const organizador = await prisma.organizador.create({
    data: {
      nome,
      email,
      senhaHash
    }
  });

  return {
    id: organizador.id,
    nome: organizador.nome,
    email: organizador.email
  };
}

async function login({ email, senha }) {
  const organizador = await prisma.organizador.findUnique({
    where: {
      email
    }
  });

  if (!organizador) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const senhaCorreta = await bcrypt.compare(senha, organizador.senhaHash);

  if (!senhaCorreta) {
    throw new Error("E-mail ou senha inválidos.");
  }

  const token = jwt.sign(
    {
      id: organizador.id,
      email: organizador.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  return {
    token,
    organizador: {
      id: organizador.id,
      nome: organizador.nome,
      email: organizador.email
    }
  };
}

export default {
  cadastrar,
  login
};