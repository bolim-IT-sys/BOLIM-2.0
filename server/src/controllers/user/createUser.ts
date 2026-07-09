import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../models/User";
import { UserModule } from "../../models/UserModule";

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, role, moduleIds } = req.body;

    const exists = await User.findOne({
      where: {
        username,
      },
    });

    if (exists) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    if (role === "SUPER_ADMIN") {
      const existingSuperAdmin = await User.count({
        where: {
          role: "SUPER_ADMIN",
        },
      });

      if (existingSuperAdmin > 0) {
        return res.status(400).json({
          message: "Only one Super Admin is allowed",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      passwordHash,
      role,
      active: true,
    });

    if (Array.isArray(moduleIds) && moduleIds.length) {
      await UserModule.bulkCreate(
        moduleIds.map((moduleId: number) => ({
          userId: user.id,
          moduleId,
        })),
      );
    }

    return res.status(201).json({
      message: "User created",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to create user",
    });
  }
};
