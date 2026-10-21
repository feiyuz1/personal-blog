import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const runFile = promisify(execFile);
const scriptPath = fileURLToPath(
  new URL("./prepare-standalone.mjs", import.meta.url),
);

async function fixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "blog-standalone-test-"));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith("blog-standalone-test-"));
    await rm(root, { recursive: true, force: true });
  });
  const standalone = path.join(root, ".next", "standalone");
  await mkdir(standalone, { recursive: true });
  await mkdir(path.join(root, ".next", "static"), { recursive: true });
  await mkdir(path.join(root, "public"), { recursive: true });
  await writeFile(path.join(standalone, "server.js"), "// server fixture\n");
  await writeFile(
    path.join(root, ".next", "static", "app.js"),
    "// static fixture\n",
  );
  await writeFile(path.join(root, "public", "voice.mp3"), "audio fixture");
  return { root, standalone };
}

test("publishing standalone omits environment files while preserving runtime assets and the source environment", async (t) => {
  const { root, standalone } = await fixture(t);
  await writeFile(
    path.join(root, ".env"),
    "AI_API_KEY=fixture-only-source-secret\n",
  );
  const environmentFiles = [
    ".env",
    ".env.local",
    ".env.prod",
    ".env.production.local",
    "packages/blog/.env.prod",
  ];
  for (const relative of environmentFiles) {
    const filename = path.join(standalone, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, "AI_API_KEY=fixture-only-release-secret\n");
  }

  await runFile(process.execPath, [scriptPath], { cwd: root });

  for (const relative of environmentFiles) {
    await assert.rejects(stat(path.join(standalone, relative)), {
      code: "ENOENT",
    });
  }
  assert.equal(
    await readFile(path.join(root, ".env"), "utf8"),
    "AI_API_KEY=fixture-only-source-secret\n",
  );
  assert.equal(
    await readFile(path.join(standalone, "server.js"), "utf8"),
    "// server fixture\n",
  );
  assert.equal(
    await readFile(path.join(standalone, "public", "voice.mp3"), "utf8"),
    "audio fixture",
  );
  assert.equal(
    await readFile(path.join(standalone, ".next", "static", "app.js"), "utf8"),
    "// static fixture\n",
  );
});

test("environment cleanup does not follow directory links outside the release", async (t) => {
  const { root, standalone } = await fixture(t);
  const outside = path.join(root, "outside-release");
  await mkdir(outside);
  await writeFile(
    path.join(outside, ".env"),
    "SESSION_SECRET=fixture-only-external-secret\n",
  );
  await writeFile(
    path.join(standalone, ".env"),
    "SESSION_SECRET=fixture-only-release-secret\n",
  );
  await symlink(
    outside,
    path.join(standalone, "external-assets"),
    process.platform === "win32" ? "junction" : "dir",
  );

  await runFile(process.execPath, [scriptPath], { cwd: root });

  await assert.rejects(stat(path.join(standalone, ".env")), { code: "ENOENT" });
  assert.equal(
    await readFile(path.join(outside, ".env"), "utf8"),
    "SESSION_SECRET=fixture-only-external-secret\n",
  );
});
