import { Router } from "express";
import inscricaoControlador from "../controladores/inscricao.controlador.js";
import { autenticar } from "../middlewares/autenticacao.middleware.js";
import { verificarDonoPorInscricao } from "../middlewares/autorizacao.middleware.js";

const router = Router();

router.post("/:id/inscricoes", inscricaoControlador.inscrever);
router.get("/:id/inscricoes", inscricaoControlador.listarPorCampeonato);
router.delete("/inscricoes/:id", autenticar, verificarDonoPorInscricao, inscricaoControlador.excluir);

export default router;