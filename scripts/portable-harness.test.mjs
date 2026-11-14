import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HOSTS, PLUGINS, renderPortable, writePortable, readText } from "./portable-harness.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "pstacked space "));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const put = (path, value) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), value);
  };
  put("portability/release.json", '{"version":"0.1.0"}');
  for (const host of [...HOSTS, "common"]) put(`portability/adapters/${host}.md`, readText(join(root, `portability/adapters/${host}.md`)));
  for (const plugin of PLUGINS) {
    put(`${plugin}/.cursor-plugin/plugin.json`, JSON.stringify({ name: plugin, description: "Fixture", author: { name: "Fixture author" }, license: "MIT" }));
    put(`${plugin}/skills/example/SKILL.md`, "---\r\nname: example\r\ndescription: Fixture skill\r\ndisable-model-invocation: true\r\n---\r\nRead [reference](references/example.md) and [guide](../../docs/guide/README.md).\r\n");
    put(`${plugin}/skills/example/references/example.md`, "# Reference\r\nBundled evidence.\r\n");
    put(`${plugin}/skills/example/scripts/run.sh`, "#!/usr/bin/env bash\r\nprintf 'ok'\r\n");
    chmodSync(join(dir, `${plugin}/skills/example/scripts/run.sh`), 0o755);
    put(`${plugin}/docs/guide/README.md`, "# Guide\r\n[Not packaged](../../automations/example.md)\r\n");
    put(`${plugin}/automations/example.md`, "# Optional automation\n");
    put(`${plugin}/agents/reviewer.md`, "---\nname: reviewer\ndescription: Reviewer\n---\n# Review\nRead the rubric.\n");
    put(`${plugin}/README.md`, "# Fixture\r\n");
    put(`${plugin}/LICENSE`, "MIT fixture\r\n");
  }
  execFileSync("git", ["init", "--quiet"], { cwd: dir });
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "."], { cwd: dir });
  execFileSync("git", ["update-index", "--chmod=+x", "pstack/skills/example/scripts/run.sh", "thermos/skills/example/scripts/run.sh"], { cwd: dir });
  return { dir, put };
}

test("packages keep complete skills, role briefs, references, licenses and executable modes", (t) => {
  const { dir } = fixture(t);
  const files = renderPortable(dir);
  for (const host of HOSTS) for (const plugin of ["pstacked", "thermos"]) {
    const prefix = `${host}/${plugin}/`;
    assert.equal(JSON.parse(files.get(prefix + "plugin.json").bytes).name, plugin);
    assert.equal(files.get(prefix + "skills/example/scripts/run.sh").executable, true);
    assert.match(files.get(prefix + "skills/example/SKILL.md").bytes.toString(), /\.\.\/\.\.\/docs\/harness\/host.md/);
    assert.match(files.get(prefix + "agents/reviewer.md").bytes.toString(), /\.\.\/docs\/harness\/host.md/);
    assert.ok(files.has(prefix + "skills/example/references/example.md"));
    assert.equal(files.get(prefix + "LICENSE").bytes.toString(), "MIT fixture\n");
    assert.match(files.get(prefix + "docs/guide/README.md").bytes.toString(), /https:\/\/github.com\/cursor\/plugins\/blob\/main\//);
    assert.equal(files.has(prefix + "automations/example.md"), false);
    if (host === "codex") assert.match(files.get(prefix + "skills/example/agents/openai.yaml").bytes.toString(), /allow_implicit_invocation: false/);
    if (host === "gemini") assert.equal(JSON.parse(files.get(prefix + "gemini-extension.json").bytes).name, plugin);
  }
});

test("CRLF and LF input yield identical packages without changing upstream sources", (t) => {
  const { dir, put } = fixture(t);
  const original = readFileSync(join(dir, "pstack/skills/example/SKILL.md"));
  const first = renderPortable(dir);
  assert.deepEqual(readFileSync(join(dir, "pstack/skills/example/SKILL.md")), original);
  put("pstack/skills/example/SKILL.md", original.toString().replace(/\r\n/g, "\n"));
  assert.deepEqual(renderPortable(dir), first);
});

test("generation is idempotent, detects drift, and incorporates newly added upstream skills", (t) => {
  const { dir, put } = fixture(t);
  writePortable(dir);
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "."], { cwd: dir });
  writePortable(dir, true);
  put("harness/portable/codex/pstacked/README.md", "edited generated file");
  assert.throws(() => writePortable(dir, true), /out of date/);
  put("pstack/skills/new-skill/SKILL.md", "---\nname: new-skill\ndescription: New upstream skill\n---\n# New\n");
  writePortable(dir);
  execFileSync("git", ["-c", "core.autocrlf=false", "add", "."], { cwd: dir });
  writePortable(dir, true);
  for (const host of HOSTS) assert.ok(renderPortable(dir).has(`${host}/pstacked/skills/new-skill/SKILL.md`));
});

test("invalid upstream skill metadata fails before generated output is replaced", (t) => {
  const { dir, put } = fixture(t);
  writePortable(dir);
  const before = readFileSync(join(dir, "harness/portable/codex/pstacked/plugin.json"));
  put("pstack/skills/example/SKILL.md", "---\nname: different\ndescription: Invalid\n---\n# Invalid\n");
  assert.throws(() => writePortable(dir), /invalid skill name/);
  assert.deepEqual(readFileSync(join(dir, "harness/portable/codex/pstacked/plugin.json")), before);
});

test("actual marketplace resolves only pstacked and thermos inside the repository", () => {
  const marketplace = JSON.parse(readText(join(root, ".agents/plugins/marketplace.json")));
  assert.equal(marketplace.name, "pstacked");
  assert.deepEqual(marketplace.plugins.map((entry) => entry.name), ["pstacked", "thermos"]);
  for (const entry of marketplace.plugins) {
    assert.equal(entry.source.source, "local");
    assert.equal(entry.source.path, `./harness/portable/codex/${entry.name}`);
    assert.equal(JSON.parse(readText(join(root, entry.source.path, "plugin.json"))).name, entry.name);
  }
});
