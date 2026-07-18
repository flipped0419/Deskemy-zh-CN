import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const partsDir = path.join(here, "localize-zh.parts");
const parts = fs
  .readdirSync(partsDir)
  .filter((name) => name.endsWith(".txt"))
  .sort();

if (parts.length === 0) {
  throw new Error("未找到汉化脚本分片。");
}

const source = parts
  .map((name) => fs.readFileSync(path.join(partsDir, name), "utf8"))
  .join("");
const temp = path.join(os.tmpdir(), `deskemy-localize-${process.pid}-${Date.now()}.mjs`);
fs.writeFileSync(temp, source, "utf8");

try {
  const result = spawnSync(process.execPath, [temp, ...process.argv.slice(2)], {
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  fs.rmSync(temp, { force: true });
}
