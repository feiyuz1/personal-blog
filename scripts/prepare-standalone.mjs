import { access, cp, mkdir } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const nextOutput = path.join(projectRoot, ".next");
const standaloneRoot = path.join(nextOutput, "standalone");
const standaloneServer = path.join(standaloneRoot, "server.js");

try {
  await access(standaloneServer);
} catch {
  throw new Error('Standalone build not found. Run "npm run build" first.');
}

await mkdir(path.join(standaloneRoot, ".next"), { recursive: true });
await cp(
  path.join(nextOutput, "static"),
  path.join(standaloneRoot, ".next", "static"),
  { recursive: true, force: true },
);
await cp(
  path.join(projectRoot, "public"),
  path.join(standaloneRoot, "public"),
  {
    recursive: true,
    force: true,
  },
);

console.log("Standalone runtime assets are ready.");
