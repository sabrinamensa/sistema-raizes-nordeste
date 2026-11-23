
import Database from "better-sqlite3";

// Cria ou abre o arquivo do banco de dados
const db = new Database("raizes-nordeste.db");

// Cria a tabela de produtos, se ela ainda não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL,
    categoria TEXT NOT NULL
  )
`);

// Adiciona os produtos iniciais apenas se a tabela estiver vazia
const resultado = db
  .prepare("SELECT COUNT(*) AS total FROM produtos")
  .get() as { total: number };

if (resultado.total === 0) {
  const inserir = db.prepare(`
    INSERT INTO produtos (nome, preco, categoria)
    VALUES (?, ?, ?)
  `);

  inserir.run("Cuscuz Nordestino", 12, "Comidas");
  inserir.run("Tapioca de Queijo", 15, "Comidas");
  inserir.run("Bolo de Milho", 8, "Sobremesas");
}

 // Criar a tabela de estoque
db.exec(`
  CREATE TABLE IF NOT EXISTS estoque (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    produto_id INTEGER NOT NULL UNIQUE,
    quantidade INTEGER NOT NULL DEFAULT 0
      CHECK (quantidade >= 0),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
  )
`);

// Criar o estoque inicial dos produtos cadastrados
db.exec(`
  INSERT OR IGNORE INTO estoque (produto_id, quantidade)
  SELECT id, 0 FROM produtos
`);

 // Criar tabela de pedidos
db.exec(`
  CREATE TABLE IF NOT EXISTS pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    valor_total REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDENTE',
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Criar tabela de itens dos pedidos
db.exec(`
  CREATE TABLE IF NOT EXISTS itens_pedido (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    produto_id INTEGER NOT NULL,
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    preco_unitario REAL NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
  )
`);
// Criar tabela de usuários
db.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil TEXT NOT NULL DEFAULT 'CLIENTE'
      CHECK (perfil IN ('CLIENTE', 'COZINHA', 'GERENTE'))
  )
`);
export default db;
