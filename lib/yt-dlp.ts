import { existsSync } from "fs";
import { execSync } from "child_process";

/**
 * Resolve the path to the yt-dlp binary.
 * Checks (in order):
 *   1. process.env.YT_DLP_PATH
 *   2. Common install locations (incl. pip user installs for the current user and root)
 *   3. `which yt-dlp` with an extended PATH
 * Returns "" if not found.
 */
export function findYtDlp(): string {
  if (process.env.YT_DLP_PATH && existsSync(process.env.YT_DLP_PATH)) {
    return process.env.YT_DLP_PATH;
  }

  const home = process.env.HOME || "";
  const commonPaths = [
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    "/snap/bin/yt-dlp",
    home ? `${home}/.local/bin/yt-dlp` : "",
    "/root/.local/bin/yt-dlp",
    "/Users/explainerium/Library/Python/3.9/bin/yt-dlp", // macOS dev fallback
  ].filter(Boolean);

  for (const p of commonPaths) {
    if (existsSync(p)) return p;
  }

  // Last resort: extend PATH and use `which`. pm2's inherited PATH
  // commonly misses ~/.local/bin and /root/.local/bin.
  try {
    const extendedPath = [
      process.env.PATH || "",
      "/usr/local/bin",
      "/usr/bin",
      "/snap/bin",
      home ? `${home}/.local/bin` : "",
      "/root/.local/bin",
    ].filter(Boolean).join(":");
    const resolved = execSync("which yt-dlp", {
      encoding: "utf-8",
      env: { ...process.env, PATH: extendedPath },
    }).trim();
    if (resolved && existsSync(resolved)) return resolved;
  } catch {
    // not on PATH
  }

  return "";
}
