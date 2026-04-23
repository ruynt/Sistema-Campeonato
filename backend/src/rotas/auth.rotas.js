import { Router } from "express";
import authControlador from "../controladores/auth.controlador.js";

const router = Router();

router.post("/cadastro", authControlador.cadastrar);
router.post("/login", authControlador.login);

export default router;