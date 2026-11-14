import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const branch = "sync/upstream";
function run(root, command, args) {
  return execFileSync(command, args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

export function mergeUpstream(root, ref) {
  if (run(root, "git", ["status", "--porcelain"])) throw new Error("Upstream integration requires a clean checkout");
  const result = spawnSync("git", ["merge", "--no-commit", "--no-ff", ref], { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status === 0) return;
  const conflicts = run(root, "git", ["diff", "--name-only", "--diff-filter=U"]).split("\n").filter(Boolean);
  if (conflicts.length && conflicts.every((path) => path.startsWith("harness/pstack/") || path.startsWith("harness/portable/"))) {
    run(root, "git", ["checkout", "--ours", "--", ...conflicts]);
    run(root, "git", ["add", "--", ...conflicts]);
    return;
  }
  const pending = spawnSync("git", ["rev-parse", "-q", "--verify", "MERGE_HEAD"], { cwd: root, encoding: "utf8" });
  if (pending.status === 0) run(root, "git", ["merge", "--abort"]);
  throw new Error(`Upstream merge needs manual resolution: ${conflicts.join(", ") || result.stderr || result.stdout}`);
}

export function assertBotOwnedBranch(root, base, ref) {
  // Merged upstream commits have human authors; only the fork's first-parent work belongs to this bot branch.
  const authors = run(root, "git", ["log", "--first-parent", "--format=%ae", `${base}..${ref}`]);
  if (authors.split("\n").some((author) => author && author !== "41898282+github-actions[bot]@users.noreply.github.com")) {
    throw new Error(`${branch} contains human commits; preserve them and resolve the existing update manually`);
  }
}

function bodyFile(text, action) {
  const dir = mkdtempSync(join(tmpdir(), "pstacked-sync-"));
  const path = join(dir, "body.md");
  try { writeFileSync(path, text); return action(path); }
  finally { rmSync(dir, { recursive: true, force: true }); }
}

function reportFailure(root, repo, message) {
  const title = "Upstream synchronization needs attention";
  const issues = JSON.parse(run(root, "gh", ["issue", "list", "--repo", repo, "--state", "open", "--search", `${title} in:title`, "--json", "number,title"]));
  const existing = issues.find((issue) => issue.title === title);
  const body = `The scheduled update left main unchanged.\n\n${message}\n\nResolve on an isolated branch, regenerate packages, and run the portable validation workflow.\n`;
  bodyFile(body, (file) => run(root, "gh", existing
    ? ["issue", "edit", String(existing.number), "--repo", repo, "--body-file", file]
    : ["issue", "create", "--repo", repo, "--title", title, "--body-file", file]));
}

function main(root) {
  if (process.env.GITHUB_ACTIONS !== "true") throw new Error("Run this publisher through the Upstream sync GitHub workflow");
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || repo === "cursor/plugins") throw new Error("Run the workflow in your fork, not upstream");
  const gh = (...args) => run(root, "gh", [...args, "--repo", repo]);
  try {
    run(root, "git", ["fetch", "origin", "main"]);
    run(root, "git", ["fetch", "https://github.com/cursor/plugins.git", "main"]);
    const upstream = run(root, "git", ["rev-parse", "FETCH_HEAD"]);
    const releasePath = join(root, "portability/release.json");
    const release = JSON.parse(readFileSync(releasePath, "utf8"));
    if (release.lastIntegratedUpstreamCommit === upstream) {
      console.log("Already integrated the latest upstream commit.");
      return;
    }
    const remote = run(root, "git", ["ls-remote", "origin", `refs/heads/${branch}`]).split(/\s/)[0];
    if (remote) {
      run(root, "git", ["fetch", "origin", branch]);
      assertBotOwnedBranch(root, "origin/main", "FETCH_HEAD");
    }
    run(root, "git", ["switch", "-c", branch, "origin/main"]);
    mergeUpstream(root, upstream);
    const changedTooling = run(root, "git", ["diff", "--cached", "--name-only", "HEAD", "--", "scripts", ".github/workflows"]);
    if (changedTooling) throw new Error(`Review upstream tooling changes manually before running them with repository write credentials:\n${changedTooling}`);
    run(root, "git", ["config", "user.name", "github-actions[bot]"]);
    run(root, "git", ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
    const previous = release.lastIntegratedUpstreamCommit;
    release.lastIntegratedUpstreamCommit = upstream;
    const version = release.version.split(".").map(Number);
    version[2]++;
    release.version = version.join(".");
    writeFileSync(releasePath, JSON.stringify(release, null, 2) + "\n");
    run(root, process.execPath, ["scripts/generate-pstack-harness-trees.mjs"]);
    run(root, "git", ["add", "harness", "portability/release.json"]);
    run(root, process.execPath, ["scripts/generate-pstack-harness-trees.mjs", "--check"]);
    run(root, process.execPath, ["--test", "scripts/portable-harness.test.mjs", "scripts/sync-upstream.test.mjs"]);
    run(root, "git", ["commit", "-m", `chore: integrate cursor/plugins ${upstream.slice(0, 12)}`]);
    run(root, "git", ["push", `--force-with-lease=refs/heads/${branch}:${remote || ""}`, "origin", `HEAD:refs/heads/${branch}`]);
    const prs = JSON.parse(gh("pr", "list", "--head", branch, "--base", "main", "--state", "open", "--json", "number,isDraft"));
    const title = `chore: update upstream to ${upstream.slice(0, 12)}`;
    const body = `Integrates [upstream changes](https://github.com/cursor/plugins/compare/${previous}...${upstream}) and regenerates the pstack and Thermos packages.\n\nSource: ${upstream}\nPackage version: ${release.version}\n\nGenerator and integration tests passed before publication. The Windows/Linux/macOS validation job must also pass. Review before merging; installation refresh is separate.\n`;
    bodyFile(body, (file) => prs.length
      ? gh("pr", "edit", String(prs[0].number), "--title", title, "--body-file", file)
      : gh("pr", "create", "--head", branch, "--base", "main", "--draft", "--title", title, "--body-file", file));
    if (prs.length && !prs[0].isDraft) gh("pr", "ready", String(prs[0].number), "--undo");
    if (process.env.GITHUB_OUTPUT) writeFileSync(process.env.GITHUB_OUTPUT, `ref=${run(root, "git", ["rev-parse", "HEAD"])}\n`, { flag: "a" });
    console.log(`Prepared ${branch}; main remains unchanged.`);
  } catch (error) {
    try { reportFailure(root, repo, error.message); }
    catch (reportError) { console.error(`Could not report the update failure: ${reportError.message}`); }
    throw error;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(join(dirname(fileURLToPath(import.meta.url)), ".."));
}
