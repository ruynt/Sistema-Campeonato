import { Router } from "express";
import campeonatoControlador from "../controladores/campeonato.controlador.js";
import { autenticar } from "../middlewares/autenticacao.middleware.js";
import { verificarDonoCampeonato } from "../middlewares/autorizacao.middleware.js";

const router = Router();

router.post("/", autenticar, campeonatoControlador.criar);
router.get("/", campeonatoControlador.listar);
router.get("/meus", autenticar, campeonatoControlador.listarMeus);
router.get("/publicos", campeonatoControlador.listarPublicos);
router.get("/:id", campeonatoControlador.buscarPorId);
router.delete("/:id", autenticar, verificarDonoCampeonato, campeonatoControlador.excluir);

export default router;