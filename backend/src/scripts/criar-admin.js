import bcrypt from "bcryptjs";
import { prisma } from "../banco/prisma.js";

async function main() {
  const nome = "Administrador Principal";
  const email = "admin@plataforma.com";
  const senha = "123456";

  const usuarioExistente = await prisma.usuario.findUnique({
    where: { email }
  });

  if (usuarioExistente) {
    console.log("Já existe um admin com esse e-mail.");
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  const admin = await prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      papel: "ADMIN"
    }
  });

  console.log("Admin criado com sucesso:");
  console.log({
    id: admin.id,
    nome: admin.nome,
    email: admin.email,
    papel: admin.papel
  });
}

main()
  .catch((error) => {
    console.error("Erro ao criar admin:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });