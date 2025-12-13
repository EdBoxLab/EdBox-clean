import fs from "fs";
import path from "path";

const templatesDir = path.join(process.cwd(), "src/app/api/coursecreation/templates");

export function listTemplates(): string[] {
  return fs.readdirSync(templatesDir).filter(f => f.endsWith(".md"));
}

export function getTemplateContent(filename: string): string {
  const filePath = path.join(templatesDir, filename);
  if (!fs.existsSync(filePath)) throw new Error(`Template ${filename} not found`);
  return fs.readFileSync(filePath, "utf-8");
}
