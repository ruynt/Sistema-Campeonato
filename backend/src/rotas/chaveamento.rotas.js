import { Router } from "express";
import chaveamentoControlador from "../controladores/chaveamento.controlador.js";

const router = Router();

router.patch("/:id/encerrar-inscricoes", chaveamentoControlador.encerrarInscricoes);
router.post("/:id/chaveamento", chaveamentoControlador.gerarChaveamento);
router.get("/:id/jogos", chaveamentoControlador.listarJogos);

export default router;