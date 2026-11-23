import {
  autenticar,
  permitirPerfis
} from "../middlewares/auth.middleware";
import { Router } from "express";
import db from "../database/db";

const router = Router();

// Consultar todos os produtos
router.get("/", (req, res) => {
  const produtos = db.prepare(`
    SELECT * FROM produtos
  `).all();

  res.json(produtos);
});

// Cadastrar um novo produto
router.post(
  "/",
  autenticar,
  permitirPerfis("GERENTE"),
  (req, res) => {
  const { nome, preco, categoria } = req.body ?? {};

  if (
    typeof nome !== "string" ||
    nome.trim() === "" ||
    typeof preco !== "number" ||
    !Number.isFinite(preco) ||
    preco <= 0 ||
    typeof categoria !== "string" ||
    categoria.trim() === ""
  ) {
    return res.status(400).json({
      mensagem: "Informe nome, preço positivo e categoria válidos."
    });
  }

  const resultado = db.transaction(() => {
    const cadastro = db.prepare(`
      INSERT INTO produtos (nome, preco, categoria)
      VALUES (?, ?, ?)
    `).run(nome.trim(), preco, categoria.trim());

    const id = Number(cadastro.lastInsertRowid);

    db.prepare(`
      INSERT INTO estoque (produto_id, quantidade)
      VALUES (?, 0)
    `).run(id);

    return id;
  })();

  res.status(201).json({
    mensagem: "Produto cadastrado com sucesso!",
    produto: {
      id: resultado,
      nome: nome.trim(),
      preco,
      categoria: categoria.trim()
    }
  });
});

export default router;
