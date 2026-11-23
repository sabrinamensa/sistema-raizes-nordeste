import authRoutes from "./routes/auth.routes";
import "dotenv/config";
import express from "express";
import "./database/db";

import produtosRoutes from "./routes/produtos.routes";
import estoqueRoutes from "./routes/estoque.routes";
import pedidosRoutes from "./routes/pedidos.routes";
import relatoriosRoutes from "./routes/relatorios.routes";

const app = express();

app.use(express.json());
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
