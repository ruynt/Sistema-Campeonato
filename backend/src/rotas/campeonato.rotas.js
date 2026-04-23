import { Router } from "express";
import campeonatoControlador from "../controladores/campeonato.controlador.js";

const router = Router();

router.post("/", campeonatoControlador.criar);
router.get("/", campeonatoControlador.listar);
router.get("/:id", campeonatoControlador.buscarPorId);
router.delete("/:id", campeonatoControlador.excluir);

export default router;