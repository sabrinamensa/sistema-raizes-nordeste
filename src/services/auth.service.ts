
import db from "../database/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: "CLIENTE" | "COZINHA" | "GERENTE";
};

export async function fazerLogin(
  email: string,
  senha: string
) {
  // Procura o usuário pelo e-mail
  const usuario = db.prepare(`
    SELECT * FROM usuarios WHERE email = ?
  `).get(email) as Usuario | undefined;

  if (!usuario) {
    throw new Error("E-mail ou senha inválidos");
  }

  // Verifica a senha
  const senhaCorreta = await bcrypt.compare(
    senha,
    usuario.senha_hash
  );

  if (!senhaCorreta) {
    throw new Error("E-mail ou senha inválidos");
  }

  // Lê a chave secreta do ambiente
  const chaveSecreta = process.env.JWT_SECRET;

  if (!chaveSecreta) {
    throw new Error("JWT_SECRET não configurado");
  }

  // Gera um token válido por 1 hora
  const token = jwt.sign(
    {
      perfil: usuario.perfil
    },
    chaveSecreta,
    {
      subject: String(usuario.id),
      expiresIn: "1h"
    }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil
    }
  };
}
