import { Request, Response, NextFunction } from "express";

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const user = (req as any).user;

  if (!user || user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  next();
};
