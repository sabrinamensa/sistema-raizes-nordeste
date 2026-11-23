# Sistema Raízes do Nordeste

API REST desenvolvida com Node.js, TypeScript, Express e SQLite.

## Funcionalidades

- Autenticação JWT e controle de permissões
- Cadastro e consulta de produtos
- Controle de estoque
- Criação e consulta de pedidos
- Pagamento simulado aprovado ou recusado
- Atualização do status dos pedidos
- Relatórios de vendas e estoque baixo

## Tecnologias

Node.js, TypeScript, Express, SQLite, JWT e bcryptjs.

## Instalação

1. Execute `npm install`.
2. Crie o arquivo `.env` com uma chave `JWT_SECRET`, usando `.env.example` como referência.
3. Compile com `npx tsc`.
4. Inicie com `node dist/server.js`.

A API funciona em `http://localhost:3000`.

## Testes

Com o servidor em execução, configure as variáveis `SENHA_GERENTE_TESTE` e `SENHA_CLIENTE_TESTE` com as senhas das contas locais de teste.

Execute:

`node --test tests/api.test.js`

Último resultado: **17 testes aprovados e 0 falhas**.

Os testes dependem de dados previamente cadastrados, e alguns criam pedidos no banco local.

## Observações

O pagamento é simulado. O projeto foi desenvolvido para fins educacionais e ainda possui funcionalidades complementares pendentes.

## Documentação da API — Swagger

O projeto disponibiliza documentação interativa dos endpoints utilizando Swagger UI e OpenAPI 3.0.

Para acessar:

1. Instale as dependências com `npm install`.
2. Compile o projeto com `npx tsc`.
3. Inicie o servidor com `node dist/server.js`.
4. Abra no navegador: http://localhost:3000/api-docs

A documentação apresenta as rotas de autenticação, produtos, estoque, pedidos, pagamentos simulados e relatórios.

**Observação:** o Swagger funciona localmente, com o servidor em execução.