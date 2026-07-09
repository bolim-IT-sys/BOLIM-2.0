import { Request, Response } from "express";
import { User } from "../../models/User";

export const getCurrentUser = async (req: any, res: Response) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ["id", "username", "role", "active"],
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.json(user);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to load user",
    });
  }
};
