// Estende o tipo Request do Express para incluir req.user
// após validação pelo authMiddleware.

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email?: string;
      };
    }
  }
}

export {};
