
import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import "./database/db";

import authRoutes from "./routes/auth.routes";
import produtosRoutes from "./routes/produtos.routes";
import estoqueRoutes from "./routes/estoque.routes";
import pedidosRoutes from "./routes/pedidos.routes";
import relatoriosRoutes from "./routes/relatorios.routes";

const app = express();

app.use(express.json());

// Documentação Swagger
const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Sistema Raízes do Nordeste",
    version: "1.0.0",
    description:
      "API REST para gerenciamento de produtos, estoque, pedidos e vendas."
  },
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    }
  },
  paths: {
    "/auth/login": {
      post: {
        summary: "Autenticar usuário",
        tags: ["Auth"],
        responses: {
          "200": { description: "Login realizado com sucesso" },
          "401": { description: "Credenciais inválidas" }
        }
      }
    },
    "/produtos": {
      get: {
        summary: "Listar produtos",
        tags: ["Produtos"],
        responses: {
          "200": { description: "Lista de produtos" }
        }
      },
      post: {
        summary: "Cadastrar produto",
        tags: ["Produtos"],
        security: [{ bearerAuth: [] }],
        responses: {
          "201": { description: "Produto cadastrado" },
          "401": { description: "Não autenticado" },
          "403": { description: "Acesso negado" }
        }
      }
    },
    "/estoque": {
      get: {
        summary: "Consultar estoque",
        tags: ["Estoque"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Consulta realizada" },
          "401": { description: "Não autenticado" }
        }
      }
    },
    "/estoque/entrada": {
      post: {
        summary: "Registrar entrada no estoque",
        tags: ["Estoque"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Estoque atualizado" }
        }
      }
    },
    "/estoque/saida": {
      post: {
        summary: "Registrar saída do estoque",
        tags: ["Estoque"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Estoque atualizado" }
        }
      }
    },
    "/pedidos": {
      get: {
        summary: "Listar pedidos",
        tags: ["Pedidos"],
        responses: {
          "200": { description: "Lista de pedidos" }
        }
      },
      post: {
        summary: "Criar pedido",
        tags: ["Pedidos"],
        responses: {
          "201": { description: "Pedido criado" },
          "400": { description: "Dados inválidos" }
        }
      }
    },
    "/pedidos/{id}": {
      get: {
        summary: "Consultar pedido",
        tags: ["Pedidos"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": { description: "Pedido encontrado" },
          "404": { description: "Pedido inexistente" }
        }
      }
    },
    "/pedidos/{id}/pagar": {
      post: {
        summary: "Simular pagamento",
        tags: ["Pagamento"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": { description: "Pagamento aprovado" },
          "400": { description: "Dados inválidos ou estoque insuficiente" },
          "402": { description: "Pagamento recusado" }
        }
      }
    },
    "/pedidos/{id}/status": {
      patch: {
        summary: "Atualizar status do pedido",
        tags: ["Pedidos"],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": { description: "Status atualizado" },
          "403": { description: "Acesso negado" }
        }
      }
    },
    "/relatorios/vendas": {
      get: {
        summary: "Relatório de vendas",
        tags: ["Relatórios"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Relatório gerado" }
        }
      }
    },
    "/relatorios/estoque-baixo": {
      get: {
        summary: "Relatório de estoque baixo",
        tags: ["Relatórios"],
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Relatório gerado" }
        }
      }
    }
  }
};

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/auth", authRoutes);
app.use("/produtos", produtosRoutes);
app.use("/estoque", estoqueRoutes);
app.use("/pedidos", pedidosRoutes);
app.use("/relatorios", relatoriosRoutes);

// Página inicial
app.get("/", (req, res) => {
  res.json({
    mensagem: "API Raízes do Nordeste funcionando!"
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
