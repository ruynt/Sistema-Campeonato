import { Router } from "express";
import inscricaoControlador from "../controladores/inscricao.controlador.js";
import { autenticarParticipante } from "../middlewares/autenticacaoParticipante.middleware.js";
import { autenticarAdmin } from "../middlewares/autenticacaoAdmin.middleware.js";

const router = Router();

router.post("/:id/inscricoes", autenticarParticipante, inscricaoControlador.inscrever);
router.get("/:id/inscricoes", inscricaoControlador.listarPorCampeonato);
router.put("/inscricoes/:id", autenticarAdmin, inscricaoControlador.atualizar);
router.delete("/inscricoes/:id", autenticarAdmin, inscricaoControlador.excluir);

export default router;