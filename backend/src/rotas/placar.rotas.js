import { Router } from "express";
import placarControlador from "../controladores/placar.controlador.js";
import { autenticar } from "../middlewares/autenticacao.middleware.js";
import { verificarDonoPorJogo } from "../middlewares/autorizacao.middleware.js";

const router = Router();

router.get("/jogos/:id", placarControlador.buscarJogoPorId);
router.patch("/jogos/:id/placar", autenticar, verificarDonoPorJogo, placarControlador.registrarPlacar);

export default router;