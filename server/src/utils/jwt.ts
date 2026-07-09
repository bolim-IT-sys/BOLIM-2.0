import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  modules: string[];
}

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId: number) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "8h",
  });
};
