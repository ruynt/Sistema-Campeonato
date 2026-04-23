import { Router } from "express";
import resumoControlador from "../controladores/resumo.controlador.js";

const router = Router();

router.get("/:id/resumo", resumoControlador.buscarResumo);

export default router;