import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../models/User";
import { RefreshToken } from "../../models/RefreshToken";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { Module } from "../../models";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, rememberMe } = req.body;
    //console.log("BODY:", req.body);
    //console.log("Login attempt:", username);
    const user = await User.findOne({
      where: { username },
      include: [{ model: Module, as: "modules" }],
    });
    //console.log("User found:", user?.username);
    if (!user) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        message: "Account has been disabled. Contact your administrator.",
      });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    //console.log("Password valid:", valid);
    if (!valid) {
      return res.status(401).json({
        message: "Invalid username or password",
      });
    }

    const modules = user.modules?.map((module) => module.code) || [];

    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      modules,
    });

    const refreshToken = generateRefreshToken(user.id);
    // Dynamic cookie expiration timeline
    const COOKIE_EXPIRY = rememberMe
      ? 30 * 24 * 60 * 60 * 1000 // 30 Days if "Remember Me" is checked
      : 30 * 60 * 1000; // 30 Minutes

    const expiresAt = new Date(Date.now() + COOKIE_EXPIRY);
    await RefreshToken.create({
      token: refreshToken,
      user_id: user.id,
      expires_at: expiresAt,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: COOKIE_EXPIRY,
      path: "/",
      //secure: process.env.NODE_ENV === "production",
      //sameSite: "strict",
      // maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    // For production HTTPS: secure: true sameSite: "none"

    return res.json({
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        modules: modules,
      },
    });
  } catch (error) {
    console.error("Login Controller Error", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
