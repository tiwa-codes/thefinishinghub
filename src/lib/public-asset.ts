import fs from "fs";
import path from "path";

/**
 * True once a real file has been dropped into public/<relativePath>.
 * Lets sections fall back to a placeholder until pending photography lands,
 * then pick it up automatically with no code changes.
 */
export function publicAssetExists(relativePath: string): boolean {
  const filePath = path.join(process.cwd(), "public", relativePath);
  return fs.existsSync(filePath);
}
