import resumoServico from "../servicos/resumo.servico.js";

async function buscarResumo(req, res) {
  try {
    const { id } = req.params;

    const resumo = await resumoServico.buscarResumo(id);

    return res.json(resumo);
  } catch (error) {
    return res.status(404).json({
      erro: error.message
    });
  }
}

export default {
  buscarResumo
};