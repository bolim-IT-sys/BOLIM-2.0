import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../../models/User";
import { UserModule } from "../../models/UserModule"; // 🔄 Added missing model import

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, moduleIds } = req.body;

    const user = await User.findByPk(id as string);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔒 SUPER ADMIN PROTECTION: Do not let anyone rename the master superadmin identity
    if (username && user.role !== "SUPER_ADMIN") {
      user.username = username;
    }

    // Update password only if a new one was actually typed into the form field
    if (password && password.trim() !== "") {
      user.passwordHash = await bcrypt.hash(password, 12); // Match your creation salt (12)
    }

    await user.save();

    // 🔄 FIXING PERMISSION SYNC: Clear old modules and write the fresh ones
    if (Array.isArray(moduleIds)) {
      // 1. Wipe out all current permission map links for this specific user
      await UserModule.destroy({
        where: {
          userId: user.id,
        },
      });

      // 2. Insert the fresh selected modules list from the frontend
      if (moduleIds.length > 0) {
        await UserModule.bulkCreate(
          moduleIds.map((moduleId: number) => ({
            userId: user.id,
            moduleId,
          })),
        );
      }
    }

    return res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("❌ USER UPDATE CONTROLLER ERROR:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
