import { Router } from "express";
import chaveamentoControlador from "../controladores/chaveamento.controlador.js";
import { autenticar } from "../middlewares/autenticacao.middleware.js";
import { verificarDonoCampeonato } from "../middlewares/autorizacao.middleware.js";

const router = Router();

router.patch("/:id/encerrar-inscricoes", autenticar, verificarDonoCampeonato, chaveamentoControlador.encerrarInscricoes);
router.post("/:id/chaveamento", autenticar, verificarDonoCampeonato, chaveamentoControlador.gerarChaveamento);
router.get("/:id/jogos", chaveamentoControlador.listarJogos);

export default router;