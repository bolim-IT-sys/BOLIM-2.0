import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";

export const createSuperAdmin = async (req: Request, res: Response) => {
  const exists = await User.count({
    where: {
      role: "SUPER_ADMIN",
    },
  });

  if (exists > 0) {
    return res.status(403).json({
      message: "System already initialized",
    });
  }

  const { username, password } = req.body;

  const passwordHash = await bcrypt.hash(password, 12);

  await User.create({
    username,
    passwordHash,
    role: "SUPER_ADMIN",
    active: true,
  });

  return res.status(201).json({
    message: "Super Admin created",
  });
};
