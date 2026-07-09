import "express";

declare global {
  namespace Express {
    interface UserPayload {
      userId: number;
      username: string;
      role: string;
      modules: string[];
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
