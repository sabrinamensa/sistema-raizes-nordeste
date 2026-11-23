
import db from "../database/db";
import bcrypt from "bcryptjs";

type Perfil = "CLIENTE" | "COZINHA" | "GERENTE";

export async function criarUsuario(
  nome: string,
  email: string,
  senha: string,
  perfil: Perfil = "CLIENTE"
) {
  // Protege a senha antes de salvar
  const senhaHash = await bcrypt.hash(senha, 12);

  // Cadastra o usuário no banco SQLite
  const resultado = db.prepare(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil)
    VALUES (?, ?, ?, ?)
  `).run(nome, email, senhaHash, perfil);

  // Retorna os dados sem mostrar a senha
  return {
    id: resultado.lastInsertRowid,
    nome,
    email,
    perfil
  };
}
