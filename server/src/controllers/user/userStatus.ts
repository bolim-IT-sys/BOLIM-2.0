import { Request, Response } from "express";
import { User } from "../../models/User";

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 GUARD: Prevent disabling the master system account
    if (user.role === "SUPER_ADMIN" && active === false) {
      return res.status(400).json({
        message: "The master Super Admin account cannot be deactivated.",
      });
    }

    user.active = active;
    await user.save();

    return res.json({
      message: `User status altered to ${active ? "Active" : "Disabled"}`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
