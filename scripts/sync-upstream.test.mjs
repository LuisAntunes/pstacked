import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mergeUpstream, assertBotOwnedBranch } from "./sync-upstream.mjs";

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "pstacked merge "));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  git("init", "--quiet", "-b", "main");
  git("config", "user.name", "Fixture");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "core.autocrlf", "false");
  const commit = (file, value, message) => {
    writeFileSync(join(dir, file), value);
    git("add", file);
    git("commit", "-qm", message);
  };
  commit("skill.md", "original\n", "base");
  git("branch", "upstream");
  return { dir, git, commit };
}

test("upstream integration preserves the fork's customization and main until reviewed", (t) => {
  const { dir, git, commit } = fixture(t);
  commit("adapter.md", "fork adapter\n", "customization");
  const main = git("rev-parse", "main");
  git("switch", "upstream");
  commit("skill.md", "upstream improvement\n", "upstream change");
  git("switch", "-c", "sync/upstream", "main");
  mergeUpstream(dir, "upstream");
  assert.equal(readFileSync(join(dir, "adapter.md"), "utf8"), "fork adapter\n");
  assert.equal(readFileSync(join(dir, "skill.md"), "utf8"), "upstream improvement\n");
  assert.equal(git("rev-parse", "main"), main);
  assert.ok(git("rev-parse", "MERGE_HEAD"));
});

test("conflicting source changes abort without losing the fork's content", (t) => {
  const { dir, git, commit } = fixture(t);
  commit("skill.md", "fork decision\n", "fork edit");
  const main = git("rev-parse", "main");
  git("switch", "upstream");
  commit("skill.md", "upstream decision\n", "upstream edit");
  git("switch", "-c", "sync/upstream", "main");
  assert.throws(() => mergeUpstream(dir, "upstream"), /manual resolution: skill.md/);
  assert.equal(readFileSync(join(dir, "skill.md"), "utf8"), "fork decision\n");
  assert.equal(git("rev-parse", "HEAD"), main);
  assert.equal(git("status", "--porcelain"), "");
});

test("dirty working trees are rejected without modifying user work", (t) => {
  const { dir } = fixture(t);
  writeFileSync(join(dir, "skill.md"), "uncommitted work\n");
  assert.throws(() => mergeUpstream(dir, "upstream"), /clean checkout/);
  assert.equal(readFileSync(join(dir, "skill.md"), "utf8"), "uncommitted work\n");
});

test("pending bot update remains refreshable despite upstream human authors, but protects edits on the update branch", (t) => {
  const { dir, git, commit } = fixture(t);
  git("switch", "upstream");
  commit("skill.md", "new upstream content\n", "human upstream change");
  git("switch", "-c", "sync/upstream", "main");
  git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");
  mergeUpstream(dir, "upstream");
  git("commit", "-qm", "bot integration");
  assert.doesNotThrow(() => assertBotOwnedBranch(dir, "main", "HEAD"));
  git("config", "user.email", "human@example.invalid");
  commit("notes.md", "human investigation\n", "human edits pending update");
  assert.throws(() => assertBotOwnedBranch(dir, "main", "HEAD"), /contains human commits/);
});
