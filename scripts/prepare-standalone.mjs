import { access, cp, mkdir, readdir, unlink } from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const nextOutput = path.join(projectRoot, ".next");
const standaloneRoot = path.join(nextOutput, "standalone");
const standaloneServer = path.join(standaloneRoot, "server.js");

async function removeEnvironmentFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await removeEnvironmentFiles(entryPath);
    } else if (entry.name.startsWith(".env")) {
      // Do not follow directory links or touch the project's source .env files.
      await unlink(entryPath);
    }
  }
}

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

// Next.js can copy local environment files into standalone output.
// Release artifacts use credentials supplied by the runtime environment instead.
await removeEnvironmentFiles(standaloneRoot);

console.log("Standalone runtime assets are ready; environment files excluded.");
