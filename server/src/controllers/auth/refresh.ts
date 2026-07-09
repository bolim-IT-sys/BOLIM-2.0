import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../../models/User";
import { RefreshToken } from "../../models/RefreshToken";
import { generateAccessToken } from "../../utils/jwt";
import { Module } from "../../models";

export const refresh = async (req: Request, res: Response) => {
  try {
    console.log("Cookies:", req.cookies);
    const token = req.cookies.refreshToken;

    if (!token) {
      console.log("No refresh token");
      return res.status(401).json({
        message: "No refresh token",
      });
    }

    console.log("Token found");

    const storedToken = await RefreshToken.findOne({
      where: {
        token,
      },
    });

    if (!storedToken) {
      return res.status(401).json({
        message: "Invalid refresh token",
      });
    }

    console.log("Stored token:", storedToken);

    const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);
    console.log("Decoded:", decoded);
    const user = await User.findByPk(decoded.userId, {
      include: [{ model: Module, as: "modules" }],
    });
    console.log("User:", user?.username);
    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    const modules = user.modules?.map((m) => m.code) ?? [];

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      modules,
    });

    return res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        modules,
      },
    });
  } catch (error) {
    console.error("❌ ACTUAL REFRESH CONTROLLER ERROR:", error);
    return res.status(401).json({
      message: "Refresh token expired",
    });
  }
};
