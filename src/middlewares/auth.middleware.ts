
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export type Perfil = "CLIENTE" | "COZINHA" | "GERENTE";

export type UsuarioAutenticado = {
  id: number;
  perfil: Perfil;
};

export function autenticar(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const autorizacao = req.headers.authorization;

  if (!autorizacao?.startsWith("Bearer ")) {
    res.status(401).json({
      erro: "Token não fornecido"
    });
    return;
  }

  const token = autorizacao.slice(7);
  const chave = process.env.JWT_SECRET;

  if (!chave) {
    res.status(500).json({
      erro: "Configuração de autenticação indisponível"
    });
    return;
  }

  try {
    const dados = jwt.verify(token, chave) as JwtPayload;

    const perfis: Perfil[] = [
      "CLIENTE",
      "COZINHA",
      "GERENTE"
    ];

    if (
      !dados.sub ||
      !/^[1-9]\d*$/.test(dados.sub) ||
      !perfis.includes(dados.perfil as Perfil)
    ) {
      res.status(401).json({
        erro: "Token inválido"
      });
      return;
    }

    res.locals.usuario = {
      id: Number(dados.sub),
      perfil: dados.perfil
    } satisfies UsuarioAutenticado;

    next();
  } catch {
    res.status(401).json({
      erro: "Token inválido ou expirado"
    });
  }
}

export function permitirPerfis(...perfisPermitidos: Perfil[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const usuario = res.locals.usuario as
      UsuarioAutenticado | undefined;

    if (!usuario) {
      res.status(401).json({
        erro: "Usuário não autenticado"
      });
      return;
    }

    if (!perfisPermitidos.includes(usuario.perfil)) {
      res.status(403).json({
        erro: "Você não tem permissão para esta operação"
      });
      return;
    }

    next();
  };
}
