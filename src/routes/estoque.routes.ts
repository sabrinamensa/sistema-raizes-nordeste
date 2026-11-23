
import { Router } from "express";
import db from "../database/db";
import {
  autenticar,
  permitirPerfis
} from "../middlewares/auth.middleware";
const router = Router();
router.use(autenticar, permitirPerfis("GERENTE"));
// Consultar o estoque
router.get("/", (req, res) => {
  const estoque = db.prepare(`
    SELECT
      estoque.id,
      produtos.nome AS produto,
      estoque.quantidade
    FROM estoque
    INNER JOIN produtos
      ON estoque.produto_id = produtos.id
    ORDER BY produtos.id
  `).all();

  res.json(estoque);
});

// Registrar entrada de estoque
router.post("/entrada", (req, res) => {
  const { produto_id, quantidade } = req.body ?? {};

  if (
    !Number.isInteger(produto_id) ||
    produto_id <= 0 ||
    !Number.isInteger(quantidade) ||
    quantidade <= 0
  ) {
    return res.status(400).json({
      mensagem: "Informe um produto e uma quantidade válida."
    });
  }

  const produto = db.prepare(`
    SELECT id FROM produtos WHERE id = ?
  `).get(produto_id);

  if (!produto) {
    return res.status(404).json({
      mensagem: "Produto não encontrado."
    });
  }

  db.prepare(`
    INSERT INTO estoque (produto_id, quantidade)
    VALUES (?, ?)
    ON CONFLICT(produto_id)
    DO UPDATE SET quantidade = quantidade + excluded.quantidade
  `).run(produto_id, quantidade);

  const estoqueAtualizado = db.prepare(`
    SELECT produto_id, quantidade
    FROM estoque
    WHERE produto_id = ?
  `).get(produto_id);

  res.json({
    mensagem: "Entrada de estoque registrada com sucesso!",
    estoque: estoqueAtualizado
  });
});

// Registrar saída de estoque
router.post("/saida", (req, res) => {
  const { produto_id, quantidade } = req.body ?? {};

  if (
    !Number.isInteger(produto_id) ||
    produto_id <= 0 ||
    !Number.isInteger(quantidade) ||
    quantidade <= 0
  ) {
    return res.status(400).json({
      mensagem: "Informe um produto e uma quantidade válida."
    });
  }

  const produto = db.prepare(`
    SELECT id FROM produtos WHERE id = ?
  `).get(produto_id);

  if (!produto) {
    return res.status(404).json({
      mensagem: "Produto não encontrado."
    });
  }

  const resultado = db.prepare(`
    UPDATE estoque
    SET quantidade = quantidade - ?
    WHERE produto_id = ?
      AND quantidade >= ?
  `).run(quantidade, produto_id, quantidade);

  if (resultado.changes === 0) {
    return res.status(400).json({
      mensagem: "Estoque insuficiente."
    });
  }

  const estoqueAtualizado = db.prepare(`
    SELECT produto_id, quantidade
    FROM estoque
    WHERE produto_id = ?
  `).get(produto_id);

  res.json({
    mensagem: "Saída de estoque registrada com sucesso!",
    estoque: estoqueAtualizado
  });
});

export default router;
