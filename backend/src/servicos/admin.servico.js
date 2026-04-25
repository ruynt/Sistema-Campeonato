import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../banco/prisma.js";

async function loginAdmin({ email, senha }) {
  const usuario = await prisma.usuario.findUnique({
    where: { email }
  });

  if (!usuario) {
    throw new Error("E-mail ou senha inválidos.");
  }

  if (usuario.papel !== "ADMIN") {
    throw new Error("Acesso permitido apenas para administradores.");
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
    admin: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel
    }
  };
}

export default {
  loginAdmin
};