import { Router } from "express";
import db from "../database/db";
import {
  autenticar,
  permitirPerfis
} from "../middlewares/auth.middleware";
const router = Router();
router.use(autenticar, permitirPerfis("GERENTE"));
router.get("/vendas", (req, res) => {
  const resumo = db.prepare(`
    SELECT
      COUNT(*) AS total_pedidos,
      COALESCE(SUM(valor_total), 0) AS total_vendido
    FROM pedidos
    WHERE status IN ('PAGO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE')
  `).get();

  const produtosVendidos = db.prepare(`
    SELECT
      produtos.nome AS produto,
      SUM(itens_pedido.quantidade) AS quantidade_vendida,
      ROUND(SUM(
        itens_pedido.quantidade *
        itens_pedido.preco_unitario
      ), 2) AS faturamento
    FROM itens_pedido
    INNER JOIN pedidos
      ON pedidos.id = itens_pedido.pedido_id
    INNER JOIN produtos
      ON produtos.id = itens_pedido.produto_id
    WHERE pedidos.status IN ('PAGO', 'EM_PREPARO', 'PRONTO', 'ENTREGUE')
    GROUP BY produtos.id, produtos.nome
    ORDER BY quantidade_vendida DESC
  `).all();

  res.json({
    resumo,
    produtos_vendidos: produtosVendidos
  });
});

 // Relatório de produtos com estoque baixo
router.get("/estoque-baixo", (req, res) => {
  const produtos = db.prepare(`
    SELECT
      produtos.id,
      produtos.nome,
      COALESCE(estoque.quantidade, 0) AS quantidade
    FROM produtos
    LEFT JOIN estoque
      ON produtos.id = estoque.produto_id
    WHERE COALESCE(estoque.quantidade, 0) <= 5
    ORDER BY quantidade ASC, produtos.nome ASC
  `).all();

  res.json({
    mensagem: "Produtos com estoque baixo",
    limite: 5,
    produtos
  });
});

export default router;
