import jwt from "jsonwebtoken";

function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization;

  if (!cabecalho) {
    return res.status(401).json({
      erro: "Token não informado."
    });
  }

  const partes = cabecalho.split(" ");
  const token = partes[1];

  if (!token) {
    return res.status(401).json({
      erro: "Token inválido."
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.organizador = {
      id: payload.id,
      email: payload.email
    };

    next();
  } catch {
    return res.status(401).json({
      erro: "Token inválido ou expirado."
    });
  }
}

export { autenticar };