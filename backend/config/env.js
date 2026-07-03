import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sourceRoot = path.resolve(__dirname, "..", "..");
const appRoot = path.resolve(__dirname, "..");

const envCandidates = [path.join(sourceRoot, ".env"), path.join(appRoot, ".env")];

export const rootEnvPath =
  envCandidates.find((candidate) => fs.existsSync(candidate)) ||
  envCandidates[0];

dotenv.config({ path: rootEnvPath });
