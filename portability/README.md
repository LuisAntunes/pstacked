# pstacked

This fork adapts only **pstack** and **Thermos** from [cursor/plugins](https://github.com/cursor/plugins). The other upstream plugins remain in Git history but are not included in our Codex marketplace or portable packages.

The upstream pstack and Thermos sources remain authoritative. Generated packages add host adapters without rewriting their engineering and review rubrics. Cursor still uses the original folders. The existing Claude Code package and marketplace remain intact.

## Codex desktop and CLI

Requirements: a Codex release with plugin marketplace commands, Git, and an authenticated Codex session. The first validated Windows CLI is 0.169.0-alpha.11.1. Node 22 is needed to generate packages, not to read instruction-only skills. GitHub workflows require an authenticated forge tool. Some upstream helpers separately require Bun, Bash, Java or browser tooling; the adapter checks these when needed.

From a terminal:

```text
codex plugin marketplace add LuisAntunes/pstacked
codex plugin add pstacked@pstacked
codex plugin add thermos@pstacked
```

Open a fresh Codex chat after installation. Select `pstacked:poteto-mode` for a pstack workflow, `pstacked:setup-pstack` to configure roles, or `thermos:thermos` for a combined review. Installing the packages does not activate either mode, modify Ponytail, or run a review on every task.

`setup-pstack` offers only models and reasoning settings supported in the current session. It asks before saving role preferences to `$CODEX_HOME/pstacked-models.md` (default `~/.codex/pstacked-models.md`). Inheritance works without any configuration file. A same-model review is labelled as such.

### Update and rollback

After reviewing and merging an upstream update PR, update the checkout. For Git marketplace installations, refresh the marketplace before reinstalling. If you registered the local checkout, run the two plugin add commands after pulling instead.

```text
git pull --ff-only
codex plugin marketplace upgrade pstacked
codex plugin add pstacked@pstacked
codex plugin add thermos@pstacked
codex plugin list --json
```

Run the Git command in your checkout. Confirm both installed versions match `portability/release.json`, then start a fresh chat. Refreshing Git does not by itself refresh the plugin cache.

To roll back, record the installed version first, remove just this marketplace source, then re-add `LuisAntunes/pstacked --ref <known-good-commit>` and install the two packages again. Do not delete the repository or your model-preference file. To return to updates, re-add the source at `--ref main`.

To uninstall, use `codex plugin remove pstacked@pstacked` and `codex plugin remove thermos@pstacked`. Remove the `pstacked` marketplace only if you no longer want either package. Other plugins and personal settings are unaffected. Keep personal model preferences unless you explicitly want to delete them.

## Hermes Agent

The generated Hermes packages are in `harness/portable/hermes/pstacked` and `harness/portable/hermes/thermos`. Add each package's **skills directory** to the active Hermes profile's `skills.external_dirs`, retaining any existing entries:

```yaml
skills:
  external_dirs:
    - /absolute/path/to/pstacked/harness/portable/hermes/pstacked/skills
    - /absolute/path/to/pstacked/harness/portable/hermes/thermos/skills
```

Use actual runtime paths. For Docker, mount the complete packages read-only and use the container paths. Keep the sibling docs and agents directories. External directories are not inherently write-protected; generated skills must not be edited by skill_manage or reflection. Update the fork and regenerate instead.

Verify with `hermes skills list`, then explicitly invoke the desired skill. The adapter uses native delegate_task when exposed, otherwise labelled sequential passes. Model preferences live in the active Hermes home as `pstacked-models.md`. Removing only these two external directory entries uninstalls discovery without deleting personal skills.

## Gemini CLI

Install the generated packages as separate local extensions, using quoted absolute paths:

```text
gemini extensions install "/absolute/path/to/pstacked/harness/portable/gemini/pstacked"
gemini extensions install "/absolute/path/to/pstacked/harness/portable/gemini/thermos"
```

Verify discovery with `/skills list`. Keep the whole extension layout, including docs and agents. Avoid duplicate loose copies under shared `.agents/skills`. Do not automatically enable experimental subagent features. Model preferences are read from `~/.gemini/pstacked-models.md`.

After updating the checkout, reinstall/refresh these local extensions through the Gemini CLI version's native extension management commands and confirm their versions. Uninstall only the named extensions to remove them.

## Maintenance

Only edit the original plugin sources, `portability/adapters`, and generation tooling. Then run:

```text
node scripts/generate-pstack-harness-trees.mjs
node scripts/generate-pstack-harness-trees.mjs --check
node --test scripts/portable-harness.test.mjs scripts/sync-upstream.test.mjs
```

Commit generated output with its sources. Preserve executable modes on generated shell/Bun entrypoints. Windows generation reads these from Git's index; Linux/macOS CI verifies them. No new runtime library is required by the portability tooling.

The **Portable validation** workflow runs package and integration tests on Windows, Linux, and macOS, plus existing upstream validation on Linux. Model-driven checks are separate from deterministic CI; see [compatibility](compatibility.md) for the evidence level.

The **Upstream sync** workflow runs Mondays at 09:00 UTC and on demand. It updates the bot-owned `sync/upstream` branch, regenerates packages, bumps the portable package patch version, and opens one draft PR. Cross-platform checks run explicitly before marking it ready. It never merges main. Source conflicts or changes to upstream scripts and workflows require manual integration. The workflow reports them in an issue and leaves main unchanged. Human commits on the sync branch stop automation rather than being overwritten.

GitHub Actions must be enabled, with permission for Actions to create pull requests. GitHub can disable scheduled runs on inactive public repositories; manual dispatch and repository Actions settings are the recovery path. No personal access token is needed.

See [requirements](requirements.md) and [verification scenarios](verification.md).
