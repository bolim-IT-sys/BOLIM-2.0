import { Request, Response } from "express";
import { User } from "../../models/User";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "username", "role", "active"],
      order: [["username", "ASC"]],
    });

    return res.json(users);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to load users",
    });
  }
};
