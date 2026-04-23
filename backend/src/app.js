import express from "express";
import cors from "cors";
import campeonatoRotas from "./rotas/campeonato.rotas.js";
import inscricaoRotas from "./rotas/inscricao.rotas.js";
import chaveamentoRotas from "./rotas/chaveamento.rotas.js";
import placarRotas from "./rotas/placar.rotas.js";
import podioRotas from "./rotas/podio.rotas.js";
import resumoRotas from "./rotas/resumo.rotas.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    mensagem: "API do sistema de campeonato de volei funcionando."
  });
});

app.use("/campeonatos", campeonatoRotas);
app.use("/campeonatos", inscricaoRotas);
app.use("/campeonatos", chaveamentoRotas);
app.use("/campeonatos", podioRotas);
app.use("/campeonatos", resumoRotas);
app.use("/", placarRotas);

export { app };