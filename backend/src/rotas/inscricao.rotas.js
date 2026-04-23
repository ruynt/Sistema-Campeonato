import { Router } from "express";
import inscricaoControlador from "../controladores/inscricao.controlador.js";

const router = Router();

router.post("/:id/inscricoes", inscricaoControlador.inscrever);
router.get("/:id/inscricoes", inscricaoControlador.listarPorCampeonato);
router.delete("/inscricoes/:id", inscricaoControlador.excluir);

export default router;