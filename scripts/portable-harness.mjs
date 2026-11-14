import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix, relative, sep } from "node:path";

export const HOSTS = ["codex", "hermes", "gemini"];
export const PLUGINS = ["pstack", "thermos"];
export const slash = (path) => path.split(sep).join("/");
export const readText = (path) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");

export function walk(dir) {
  return readdirSync(dir).sort().flatMap((name) => {
    if (["node_modules", ".DS_Store", "__pycache__"].includes(name)) return [];
    const path = join(dir, name);
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) throw new Error(`Unexpected symlink in package source: ${path}`);
    return stat.isDirectory() ? walk(path) : [path];
  });
}

export function gitExecutables(root) {
  return new Set(execFileSync("git", ["ls-files", "--stage", "-z"], { cwd: root, encoding: "utf8" })
    .split("\0").filter((line) => line.startsWith("100755 ")).map((line) => line.slice(line.indexOf("\t") + 1)));
}

export function readEntry(path, root, executables) {
  let bytes = readFileSync(path);
  // Git's Windows checkout can add CRLF; packages must be identical on every OS.
  const text = bytes.toString("utf8");
  if (!bytes.includes(0) && Buffer.from(text).equals(bytes)) bytes = Buffer.from(text.replace(/\r\n/g, "\n"));
  return { bytes, executable: executables.has(slash(relative(root, path))) };
}

function json(value) {
  return { bytes: Buffer.from(JSON.stringify(value, null, 2) + "\n"), executable: false };
}

function wrap(text, link) {
  if (!/^---\n[\s\S]*?\n---\n/.test(text)) throw new Error("Packaged skill or agent has no frontmatter");
  return text.replace(/^(---\n[\s\S]*?\n---\n+)/, `$1Read [the host adapter](${link}) before following these instructions. It defines tool mappings, paths, configuration, and capability limits.\n\n`);
}

export function renderPortable(root) {
  const executables = gitExecutables(root);
  const files = new Map();
  const version = JSON.parse(readText(join(root, "portability/release.json"))).version;
  const common = readText(join(root, "portability/adapters/common.md"));
  for (const host of HOSTS) {
    const adapter = readText(join(root, `portability/adapters/${host}.md`));
    for (const plugin of PLUGINS) {
      const name = plugin === "pstack" ? "pstacked" : plugin;
      const prefix = `${host}/${name}`;
      const source = join(root, plugin);
      const copies = ["skills", "agents", "docs/guide"].filter((dir) => existsSync(join(source, dir)))
        .flatMap((dir) => walk(join(source, dir)));
      copies.push(join(source, "README.md"), join(source, "LICENSE"));
      const entries = new Map(copies.map((path) => [slash(relative(source, path)), readEntry(path, root, executables)]));
      entries.set("docs/harness/host.md", { bytes: Buffer.from(adapter), executable: false });
      entries.set("docs/harness/common.md", { bytes: Buffer.from(common), executable: false });
      const upstream = JSON.parse(readText(join(source, ".cursor-plugin/plugin.json")));
      const manifest = {
        "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
        name, version, description: `${upstream.description} Adapted for ${host} by pstacked.`,
        author: upstream.author, repository: "https://github.com/LuisAntunes/pstacked",
        homepage: "https://github.com/LuisAntunes/pstacked", license: upstream.license,
      };
      entries.set("plugin.json", json(manifest));
      // Preserve explicit-only entrypoints using Codex's own discovery policy.
      for (const [path, entry] of [...entries]) {
        if (/^skills\/[^/]+\/SKILL\.md$/.test(path)) {
          const text = entry.bytes.toString("utf8");
          const frontmatter = text.match(/^---\n([\s\S]*?)\n---/)?.[1];
          const skill = path.split("/")[1];
          const declared = frontmatter?.match(/^name:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, "");
          if (declared !== skill || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(skill) || skill.length > 64) {
            throw new Error(`${plugin}/${path}: invalid skill name`);
          }
          entry.bytes = Buffer.from(wrap(text, "../../docs/harness/host.md"));
          if (host === "codex" && /^disable-model-invocation:\s*true\s*$/m.test(frontmatter)) {
            const policyPath = `skills/${skill}/agents/openai.yaml`;
            if (entries.has(policyPath)) throw new Error(`${policyPath}: review upstream's existing invocation policy`);
            entries.set(policyPath, { bytes: Buffer.from("policy:\n  allow_implicit_invocation: false\n"), executable: false });
          }
        } else if (/^agents\/[^/]+\.md$/.test(path)) {
          entry.bytes = Buffer.from(wrap(entry.bytes.toString("utf8"), "../docs/harness/host.md"));
        }
      }
      if (host === "gemini") entries.set("gemini-extension.json", json({ name, version }));
      const has = (target) => entries.has(target) || [...entries.keys()].some((key) => key.startsWith(`${target}/`));
      for (const [path, entry] of entries) {
        if (path.endsWith(".md")) {
          entry.bytes = Buffer.from(entry.bytes.toString("utf8").replace(/\]\(([^)\s]+)\)/g, (link, href) => {
            if (/^[a-z][a-z0-9+.-]*:|^#/i.test(href)) return link;
            const target = posix.normalize(posix.join(posix.dirname(path), href.replace(/[#?].*/, "")));
            if (has(target)) return link;
            const original = join(source, target);
            if (!target.startsWith("../") && existsSync(original)) {
              const kind = lstatSync(original).isDirectory() ? "tree" : "blob";
              return `](https://github.com/cursor/plugins/${kind}/main/${plugin}/${target}${href.slice(href.search(/[#?]|$/))})`;
            }
            // Guide examples contain links to files the user will create, not bundled resources.
            return link;
          }));
        }
        files.set(`${prefix}/${path}`, entry);
      }
    }
  }
  return files;
}

export function writePortable(root, check = false) {
  const out = join(root, "harness", "portable");
  const files = renderPortable(root);
  if (check) {
    const executables = gitExecutables(root);
    const disk = new Map(existsSync(out) ? walk(out).map((path) => [slash(relative(out, path)), readEntry(path, root, executables)]) : []);
    const changed = [...new Set([...files.keys(), ...disk.keys()])].filter((path) => {
      const want = files.get(path), have = disk.get(path);
      return !want || !have || !want.bytes.equals(have.bytes) || (process.platform !== "win32" && want.executable !== have.executable);
    });
    if (changed.length) throw new Error(`Portable packages are out of date:\n${changed.slice(0, 20).join("\n")}`);
  } else {
    // OUT is a fixed generated subtree of the caller's repository, never a user-supplied deletion path.
    rmSync(out, { recursive: true, force: true });
    for (const [path, entry] of files) {
      const dest = join(out, path);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, entry.bytes);
      chmodSync(dest, entry.executable ? 0o755 : 0o644);
    }
  }
  console.log(`Portable packages: ${HOSTS.length} hosts, ${PLUGINS.length} plugins, ${files.size} files${check ? " verified" : " generated"}.`);
}
