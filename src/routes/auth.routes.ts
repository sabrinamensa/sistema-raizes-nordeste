
import { Router } from "express";
import { fazerLogin } from "../services/auth.service";

const router = Router();

// Rota para realizar login
router.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !email.trim() ||
      !senha
    ) {
      res.status(400).json({
        erro: "E-mail e senha são obrigatórios"
      });
      return;
    }

    const resultado = await fazerLogin(email, senha);

    res.status(200).json(resultado);
  } catch (erro) {
    if (
      erro instanceof Error &&
      erro.message === "E-mail ou senha inválidos"
    ) {
      res.status(401).json({
        erro: "E-mail ou senha inválidos"
      });
      return;
    }

    console.error("Erro ao realizar login:", erro);

    res.status(500).json({
      erro: "Erro interno do servidor"
    });
  }
});

export default router;
