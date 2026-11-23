
const { test } = require("node:test");
const assert = require("node:assert/strict");

const BASE = "http://localhost:3000";

async function verificarRota(caminho, statusEsperado, opcoes = {}) {
  const resposta = await fetch(`${BASE}${caminho}`, opcoes);

  assert.equal(
    resposta.status,
    statusEsperado,
    `Falha em ${caminho}: esperado ${statusEsperado}, recebido ${resposta.status}`
  );

  return resposta;
}

test("01 - API responde com sucesso", async () => {
  const resposta = await verificarRota("/", 200);
  const dados = await resposta.json();
  assert.ok(dados.mensagem);
});

test("02 - Lista de produtos funciona", async () => {
  const resposta = await verificarRota("/produtos", 200);
  assert.ok(Array.isArray(await resposta.json()));
});

test("03 - Lista de pedidos funciona", async () => {
  const resposta = await verificarRota("/pedidos", 200);
  assert.ok(Array.isArray(await resposta.json()));
});

test("04 - Pedido inexistente retorna 404", async () => {
  await verificarRota("/pedidos/999999", 404);
});

test("05 - ID de pedido inválido retorna 400", async () => {
  await verificarRota("/pedidos/abc", 400);
});

test("06 - Pedido sem itens retorna 400", async () => {
  await verificarRota("/pedidos", 400, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itens: [] })
  });
});

test("07 - Estoque sem autenticação retorna 401", async () => {
  await verificarRota("/estoque", 401);
});

test("08 - Relatório sem autenticação retorna 401", async () => {
  await verificarRota("/relatorios/vendas", 401);
});

test("09 - Cadastro de produto sem autenticação retorna 401", async () => {
  await verificarRota("/produtos", 401, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Produto Teste",
      preco: 10,
      categoria: "Teste"
    })
  });
});

test("10 - Atualização de pedido sem autenticação retorna 401", async () => {
  await verificarRota("/pedidos/2/status", 401, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PRONTO" })
  });
});
