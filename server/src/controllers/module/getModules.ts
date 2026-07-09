import { Request, Response } from "express";
import { Module } from "../../models/Module";

export const getModules = async (req: Request, res: Response) => {
  try {
    const modules = await Module.findAll({
      order: [["name", "ASC"]],
    });

    return res.json(modules);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to load modules",
    });
  }
};
