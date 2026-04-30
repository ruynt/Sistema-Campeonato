import bcrypt from "bcryptjs";
import { prisma } from "../banco/prisma.js";

async function main() {
  const nome = "Administrador Principal";
  const email = "admin@plataforma.com";
  const loginAdmin = "admin";
  const senha = "123456";

  const usuarioComEmailExistente = await prisma.usuario.findUnique({
    where: {
      email
    }
  });

  if (usuarioComEmailExistente) {
    const adminAtualizado = await prisma.usuario.update({
      where: {
        id: usuarioComEmailExistente.id
      },
      data: {
        loginAdmin,
        emailVerificado: true
      }
    });

    console.log("Já existia um usuário com esse e-mail. Admin atualizado com loginAdmin:");
    console.log({
      id: adminAtualizado.id,
      nome: adminAtualizado.nome,
      email: adminAtualizado.email,
      loginAdmin: adminAtualizado.loginAdmin,
      papel: adminAtualizado.papel,
      emailVerificado: adminAtualizado.emailVerificado
    });

    return;
  }

  const usuarioComLoginExistente = await prisma.usuario.findUnique({
    where: {
      loginAdmin
    }
  });

  if (usuarioComLoginExistente) {
    console.log("Já existe um admin com esse usuário de login.");
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const admin = await prisma.usuario.create({
    data: {
      nome,
      email,
      loginAdmin,
      senhaHash,
      papel: "ADMIN",
      emailVerificado: true
    }
  });

  console.log("Admin criado com sucesso:");
  console.log({
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    loginAdmin: admin.loginAdmin,
    papel: admin.papel,
    emailVerificado: admin.emailVerificado
  });
}

main()
  .catch((error) => {
    console.error("Erro ao criar admin:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

  // para rodar use: node src/scripts/criarAdmin.js
  