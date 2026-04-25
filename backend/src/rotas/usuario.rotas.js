import { Router } from "express";
import usuarioControlador from "../controladores/usuario.controlador.js";
import { autenticarParticipante } from "../middlewares/autenticacaoParticipante.middleware.js";

const router = Router();

router.post("/cadastro", usuarioControlador.cadastro);
router.post("/login", usuarioControlador.login);
router.get("/minhas-inscricoes", autenticarParticipante, usuarioControlador.minhasInscricoes);

export default router;