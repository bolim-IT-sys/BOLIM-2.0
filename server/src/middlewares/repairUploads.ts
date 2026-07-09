import multer, { StorageEngine } from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Request } from "express";

// Callback types required by Multer's diskStorage
type DestinationCallback = (error: Error | null, destination: string) => void;
type FileNameCallback = (error: Error | null, filename: string) => void;

const uploadPath: string = path.join(__dirname, "..", "uploads", "repairs");
//console.log("UPLOAD PATH:", uploadPath);

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage: StorageEngine = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: DestinationCallback,
  ): void => {
    cb(null, uploadPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: FileNameCallback,
  ): void => {
    const serial: string = req.body.serial_number || "unknown";
    const ext: string = path.extname(file.originalname);
    const cleanName: string = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[()]/g, "")
      .toLowerCase();
    const filename: string = `${serial}-${Date.now()}-${cleanName}${ext}`;

    cb(null, filename);
  },
});

export const upload = multer({ storage });
