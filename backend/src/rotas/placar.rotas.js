import { Router } from "express";
import placarControlador from "../controladores/placar.controlador.js";

const router = Router();

router.get("/jogos/:id", placarControlador.buscarJogoPorId);
router.patch("/jogos/:id/placar", placarControlador.registrarPlacar);

export default router;