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

test("01 - API funcionando", async () => {
  const resposta = await verificarRota("/", 200);
  const dados = await resposta.json();
  assert.ok(dados.mensagem);
});

test("02 - Listagem de produtos", async () => {
  const resposta = await verificarRota("/produtos", 200);
  assert.ok(Array.isArray(await resposta.json()));
});

test("03 - Listagem de pedidos", async () => {
  const resposta = await verificarRota("/pedidos", 200);
  assert.ok(Array.isArray(await resposta.json()));
});

test("04 - Consulta de pedido entregue", async () => {
  const resposta = await verificarRota("/pedidos/2", 200);
  const dados = await resposta.json();
  assert.equal(dados.pedido.status, "ENTREGUE");
});

test("05 - Pedido inexistente retorna 404", async () => {
  await verificarRota("/pedidos/999999", 404);
});

test("06 - ID invalido retorna 400", async () => {
  await verificarRota("/pedidos/abc", 400);
});

test("07 - Pedido sem itens retorna 400", async () => {
  await verificarRota("/pedidos", 400, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itens: [] })
  });
});

test("08 - Estoque protegido por login", async () => {
  await verificarRota("/estoque", 401);
});

test("09 - Relatorios protegidos por login", async () => {
  await verificarRota("/relatorios/vendas", 401);
});

test("10 - Atualizacao de pedido protegida", async () => {
  await verificarRota("/pedidos/2/status", 401, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "PRONTO" })
  });
});

test("11 - Login valido do gerente", async () => {
  const senha = process.env.SENHA_GERENTE_TESTE;

  assert.ok(
    senha,
    "Configure SENHA_GERENTE_TESTE antes de executar."
  );

  const resposta = await verificarRota("/auth/login", 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "gerente.teste@exemplo.com",
      senha
    })
  });

  const dados = await resposta.json();

  assert.ok(dados.token);
  assert.equal(dados.usuario.perfil, "GERENTE");
});

test("12 - Login com senha incorreta retorna 401", async () => {
  await verificarRota("/auth/login", 401, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "gerente.teste@exemplo.com",
      senha: "senha-incorreta-para-teste"
    })
  });
});

test("13 - Pedido com produto inexistente retorna 404", async () => {
  await verificarRota("/pedidos", 404, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itens: [
        {
          produto_id: 999999,
          quantidade: 1
        }
      ]
    })
  });
});

test("14 - Gerente autenticado acessa relatorio", async () => {
  const senha = process.env.SENHA_GERENTE_TESTE;

  assert.ok(
    senha,
    "Configure SENHA_GERENTE_TESTE antes de executar."
  );

  const login = await verificarRota("/auth/login", 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "gerente.teste@exemplo.com",
      senha
    })
  });

  const dados = await login.json();

  const resposta = await verificarRota(
    "/relatorios/vendas",
    200,
    {
      headers: {
        Authorization: `Bearer ${dados.token}`
      }
    }
  );

  const relatorio = await resposta.json();

  assert.ok(relatorio.resumo);
  assert.ok(Array.isArray(relatorio.produtos_vendidos));
});

test("15 - Cliente nao pode acessar relatorios (403)", async () => {
  const senha = process.env.SENHA_CLIENTE_TESTE;

  assert.ok(
    senha,
    "Configure SENHA_CLIENTE_TESTE antes de executar."
  );

  const login = await verificarRota("/auth/login", 200, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "cliente.teste@exemplo.com",
      senha
    })
  });

  const dados = await login.json();

  await verificarRota("/relatorios/vendas", 403, {
    headers: {
      Authorization: `Bearer ${dados.token}`
    }
  });
});

test("16 - Pagamento com estoque insuficiente retorna 400", async () => {
  const respostaProdutos = await verificarRota("/produtos", 200);
  const produtos = await respostaProdutos.json();

  assert.ok(produtos.length > 0, "Nenhum produto cadastrado.");

  const produto = produtos[0];

  const respostaPedido = await verificarRota("/pedidos", 201, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itens: [
        {
          produto_id: produto.id,
          quantidade: 1000000000
        }
      ]
    })
  });

  const dadosPedido = await respostaPedido.json();
  const pedidoId = dadosPedido.pedido.id;

  const respostaPagamento = await verificarRota(
    `/pedidos/${pedidoId}/pagar`,
    400,
    { method: "POST" }
  );

  const dadosPagamento = await respostaPagamento.json();

  assert.match(dadosPagamento.mensagem, /Estoque insuficiente/);

  const respostaConsulta = await verificarRota(
    `/pedidos/${pedidoId}`,
    200
  );

  const consulta = await respostaConsulta.json();

  assert.equal(consulta.pedido.status, "PENDENTE");
});

test("17 - Pagamento recusado mantem pedido pendente", async () => {
  const respostaProdutos = await verificarRota("/produtos", 200);
  const produtos = await respostaProdutos.json();

  assert.ok(produtos.length > 0, "Nenhum produto cadastrado.");

  const produto = produtos[0];

  const respostaPedido = await verificarRota("/pedidos", 201, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itens: [
        {
          produto_id: produto.id,
          quantidade: 1
        }
      ]
    })
  });

  const dadosPedido = await respostaPedido.json();
  const pedidoId = dadosPedido.pedido.id;

  const respostaPagamento = await verificarRota(
    `/pedidos/${pedidoId}/pagar`,
    402,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resultado: "RECUSADO"
      })
    }
  );

  const dadosPagamento = await respostaPagamento.json();

  assert.match(dadosPagamento.mensagem, /Pagamento recusado/);

  const respostaConsulta = await verificarRota(
    `/pedidos/${pedidoId}`,
    200
  );

  const consulta = await respostaConsulta.json();

  assert.equal(consulta.pedido.status, "PENDENTE");
});
