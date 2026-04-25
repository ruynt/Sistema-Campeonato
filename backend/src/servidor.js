import dotenv from "dotenv";
import { app } from "./app.js";
import usuarioRotas from "./rotas/usuario.rotas.js";
import adminRotas from "./rotas/admin.rotas.js";

dotenv.config();

app.use("/admin", adminRotas);
app.use("/usuarios", usuarioRotas);

const PORTA = process.env.PORTA || 3333;

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});