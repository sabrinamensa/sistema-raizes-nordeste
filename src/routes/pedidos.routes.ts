import { Router } from "express";
import db from "../database/db";
import {
  autenticar,
  permitirPerfis
} from "../middlewares/auth.middleware";
const router = Router();

	router.post("/", (req, res) => {
  const { itens } = req.body ?? {};

  if (
    !Array.isArray(itens) ||
    itens.length === 0 ||
    !itens.every(
      (item) =>
        item !== null &&
        Number.isInteger(item.produto_id) &&
        item.produto_id > 0 &&
        Number.isInteger(item.quantidade) &&
        item.quantidade > 0
    )
  ) {
    return res.status(400).json({
      mensagem: "Informe uma lista de itens válida."
    });
  }

  try {
    const criarPedido = db.transaction(() => {
      let valorTotal = 0;

      const itensPreparados = itens.map((item) => {
        const produto = db.prepare(`
          SELECT id, nome, preco
          FROM produtos
          WHERE id = ?
        `).get(item.produto_id) as
          | { id: number; nome: string; preco: number }
          | undefined;

        if (!produto) {
          throw new Error("Produto não encontrado.");
        }

        valorTotal += produto.preco * item.quantidade;

        return {
          produto_id: produto.id,
          nome: produto.nome,
          quantidade: item.quantidade,
          preco_unitario: produto.preco
        };
      });

      const pedido = db.prepare(`
        INSERT INTO pedidos (valor_total, status)
        VALUES (?, 'PENDENTE')
      `).run(Math.round(valorTotal * 100) / 100);

      const pedidoId = Number(pedido.lastInsertRowid);

      const inserirItem = db.prepare(`
        INSERT INTO itens_pedido
          (pedido_id, produto_id, quantidade, preco_unitario)
        VALUES (?, ?, ?, ?)
      `);

      for (const item of itensPreparados) {
        inserirItem.run(
          pedidoId,
          item.produto_id,
          item.quantidade,
          item.preco_unitario
        );
      }

      return {
        id: pedidoId,
        status: "PENDENTE",
        valor_total: Math.round(valorTotal * 100) / 100,
        itens: itensPreparados
      };
    });

    const pedido = criarPedido();

    return res.status(201).json({
      mensagem: "Pedido criado com sucesso!",
      pedido
    });
  } catch (erro) {
    if (
      erro instanceof Error &&
      erro.message === "Produto não encontrado."
    ) {
      return res.status(404).json({
        mensagem: erro.message
      });
    }

    console.error(erro);

    return res.status(500).json({
      mensagem: "Erro ao criar pedido."
    });
  }
});

 // Consultar todos os pedidos
router.get("/", (req, res) => {
  const pedidos = db.prepare(`
    SELECT id, valor_total, status, criado_em
    FROM pedidos
    ORDER BY id DESC
  `).all();

  res.json(pedidos);
});

// Consultar um pedido específico
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID do pedido inválido."
    });
  }

  const pedido = db.prepare(`
    SELECT id, valor_total, status, criado_em
    FROM pedidos
    WHERE id = ?
  `).get(id);

  if (!pedido) {
    return res.status(404).json({
      mensagem: "Pedido não encontrado."
    });
  }

  const itens = db.prepare(`
    SELECT
      itens_pedido.produto_id,
      produtos.nome,
      itens_pedido.quantidade,
      itens_pedido.preco_unitario
    FROM itens_pedido
    INNER JOIN produtos
      ON produtos.id = itens_pedido.produto_id
    WHERE itens_pedido.pedido_id = ?
  `).all(id);

  res.json({
    pedido,
    itens
  });
});

 // Simular o pagamento de um pedido

router.post("/:id/pagar", (req, res) => {
  const id = Number(req.params.id);
  const { resultado = "APROVADO" } = req.body ?? {};
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      mensagem: "ID do pedido inválido."
    });
  }
  if (!["APROVADO", "RECUSADO"].includes(resultado)) {
    return res.status(400).json({
      mensagem: "Resultado do pagamento inválido."
    });
  }

  if (resultado === "RECUSADO") {
    const pedido = db.prepare(`
      SELECT id, status
      FROM pedidos
      WHERE id = ?
    `).get(id) as
      | { id: number; status: string }
      | undefined;

    if (!pedido) {
      return res.status(404).json({
        mensagem: "Pedido não encontrado."
      });
    }

    if (pedido.status !== "PENDENTE") {
      return res.status(409).json({
        mensagem: "Pedido não está pendente."
      });
    }

    return res.status(402).json({
      mensagem: "Pagamento recusado pela simulação.",
      pedido: {
        id,
        status: "PENDENTE"
      }
    });
  }
  try {
    const realizarPagamento = db.transaction(() => {
      const pedido = db.prepare(`
        SELECT id, valor_total, status
        FROM pedidos
        WHERE id = ?
      `).get(id) as
        | { id: number; valor_total: number; status: string }
        | undefined;

      if (!pedido) {
        throw new Error("Pedido não encontrado.");
      }

      if (pedido.status !== "PENDENTE") {
        throw new Error("Pedido não está pendente.");
      }

      const itens = db.prepare(`
        SELECT produto_id, SUM(quantidade) AS quantidade
        FROM itens_pedido
        WHERE pedido_id = ?
        GROUP BY produto_id
      `).all(id) as {
        produto_id: number;
        quantidade: number;
      }[];

      if (itens.length === 0) {
        throw new Error("Pedido sem itens.");
      }

      // Verificar e descontar o estoque
      const descontar = db.prepare(`
        UPDATE estoque
        SET quantidade = quantidade - ?
        WHERE produto_id = ?
          AND quantidade >= ?
      `);

      for (const item of itens) {
        const resultado = descontar.run(
          item.quantidade,
          item.produto_id,
          item.quantidade
        );

        if (resultado.changes === 0) {
          throw new Error(
            `Estoque insuficiente para o produto ${item.produto_id}.`
          );
        }
      }

      db.prepare(`
        UPDATE pedidos
        SET status = 'PAGO'
        WHERE id = ?
      `).run(id);

      return {
        id: pedido.id,
        valor_total: pedido.valor_total,
        status: "PAGO"
      };
    });

    const pedidoPago = realizarPagamento();

    return res.json({
      mensagem: "Pagamento realizado e estoque atualizado!",
      pedido: pedidoPago
    });

  } catch (erro) {
    const mensagem =
      erro instanceof Error ? erro.message : "Erro desconhecido.";

    if (mensagem === "Pedido não encontrado.") {
      return res.status(404).json({ mensagem });
    }

    if (
      mensagem === "Pedido não está pendente." ||
      mensagem === "Pedido sem itens." ||
      mensagem.startsWith("Estoque insuficiente")
    ) {
      return res.status(400).json({ mensagem });
    }

    console.error(erro);
    return res.status(500).json({
      mensagem: "Erro interno ao processar pagamento."
    });
  }
});
// Atualizar o andamento de um pedido
router.patch(
  "/:id/status",
  autenticar,
  permitirPerfis("COZINHA", "GERENTE"),
  (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body ?? {};

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensagem: "ID do pedido inválido."
      });
    }

    const statusPermitidos = [
      "EM_PREPARO",
      "PRONTO",
      "ENTREGUE",
      "CANCELADO"
    ];

    if (!statusPermitidos.includes(status)) {
      return res.status(400).json({
        mensagem: "Status inválido.",
        status_permitidos: statusPermitidos
      });
    }

    const pedido = db.prepare(`
      SELECT id, status
      FROM pedidos
      WHERE id = ?
    `).get(id) as
      | { id: number; status: string }
      | undefined;

    if (!pedido) {
      return res.status(404).json({
        mensagem: "Pedido não encontrado."
      });
    }

    const transicoes: Record<string, string[]> = {
      PAGO: ["EM_PREPARO", "CANCELADO"],
      EM_PREPARO: ["PRONTO", "CANCELADO"],
      PRONTO: ["ENTREGUE"],
      ENTREGUE: [],
      CANCELADO: []
    };

    const proximosStatus = transicoes[pedido.status] ?? [];

    if (!proximosStatus.includes(status)) {
      return res.status(409).json({
        mensagem: "Mudança de status não permitida.",
        status_atual: pedido.status,
        proximos_status: proximosStatus
      });
    }

    db.prepare(`
      UPDATE pedidos
      SET status = ?
      WHERE id = ?
    `).run(status, id);

    return res.json({
      mensagem: "Status atualizado com sucesso!",
      pedido: {
        id,
        status
      }
    });
  }
);
export default router;
