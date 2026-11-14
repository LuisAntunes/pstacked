# Shared host rules

This adapter changes host-specific mechanics, not the plugin's engineering or review rubric. Apply it before the upstream instructions when they refer to Cursor facilities. It never overrides the user's instructions, host permissions, plan mode, or tool schemas.

## Files and skill invocation

The package root is two directories above this file. Resolve it from the loaded skill's absolute path, not the working directory. `skills/<name>/SKILL.md`, `agents/*.md`, and bundled references live beneath that root. Read the local copy; never fetch upstream `main` as a substitute for an installed skill. If a resource is absent, report that dependency instead of fabricating its contents. Relative links in the guides that describe project-created files are examples.

Run another pstack skill by reading its complete local SKILL.md and following it. Native skill invocation is optional. Do not assume `/name` is valid in every host. Use the host's actual catalog name when explaining invocation to the user. Keep the installed copy authoritative when multiple versions exist. Give every worker the absolute skill and adapter paths. For `poteto-agent` and `comment-sicko`, load the corresponding bundled agent brief; for Thermos, load each reviewer brief and its full review rubric. A worker must not search `~/.cursor/plugins/` or choose a newer unrelated installation.

## Delegation and tools

Translate `Task`, `AskQuestion`, `generalPurpose`, and todolist operations through the host adapter and the tools actually present. Tool names in a document do not make those tools available. `subagent_type` refers to a role brief, not necessarily a registered host type. Never send Cursor-only fields to a native tool.

- `readonly: true`: use host-enforced read-only access where available and include the restriction in the brief. If enforcement is unavailable, disclose that instructions alone are not a sandbox. Review work never edits source, posts comments, commits, pushes, or merges unless separately authorized.
- `readonly: false`: retain the host's existing permission boundaries.
- `environment: "cloud"`: use an explicitly created local worktree only when isolation is the required outcome. A worktree is not cloud execution. If the step requires a remote machine or cloud URL, report it unavailable.
- `cloud_base_branch`: verify the ref and give the worker an isolated checkout at that ref. Never switch the user's dirty working tree.
- `environment: "local"`, `run_in_background: true`, `file_attachments`: use native execution semantics; give file paths in the brief. Do not assume workers inherit files, tools, or chat history.
- `resume`: use a supported native continuation only when the task needs existing worker state; otherwise pass the consolidated brief to a fresh worker.
- Collect every worker result before synthesis. Remain within the session's concurrency limit and close completed task-owned workers. Never stop persistent integrations or user services.

When native delegation is absent or prohibited, do the passes sequentially and label them as same-agent work. If independent execution is essential to the requested proof, mark that step blocked. Do not convert unsupported operations into successful results.

## Models and setup-pstack

On a pstack invocation, read the host-specific model file if it exists. It is explicit plugin configuration, not an automatically loaded `.cursor/rules/` or always-applied rule. Missing roles default to `inherit-parent`; `auto` has the same meaning. Ignore the upstream hard-coded `claude-`, `grok-`, and `gpt-` defaults outside Cursor. Model and reasoning are separate settings where the host exposes them. Do not invent model IDs or assume an API listing grants access in the current agent.

For setup-pstack, replace its Cursor model detection, budget rewriting, and write steps with this process:

1. Read the existing host model file. Enumerate only models and reasoning settings accepted by the current delegation tool or a host capability API. If no enumeration is available, offer inheritance; do not ask for credentials or probe arbitrary providers.
2. Reuse the role labels from the bundled setup-pstack skill. Represent a role with `role: inherit-parent` or `role: confirmed-model reasoning`; panels use comma-separated entries. Preserve the upstream panel size when no configuration exists, running the slots with inheritance.
3. Explain the proposed role choices and any unavailable model diversity. Ask the user to accept before writing their preferences. Never apply an unsupported reasoning level. No configuration change is necessary to use the default inheritance behavior.
4. Write only the dedicated model file, preserving unrelated files. The new choices apply on the next skill invocation. Never put personal choices into the package, AGENTS.md, CLAUDE.md, GEMINI.md, or the user's general model settings.
5. Keep the optional verification-skill offers, provided their skills and required tools are available.

`pstack-models.mdc` maps to this file. A parent must pass the relevant choices to workers. A same-model panel is several review passes, not independent model-family evidence. An Arena cross-judge must be from a confirmed different family; if none is available, report that gate unavailable and do not claim it passed.

## Paths, integrations, and platform behavior

`.cursor/skills/`, `~/.cursor/skills/`, `.cursor-plugin/`, and `.cursor/rules/` are Cursor paths. Use the host's documented locations for new project skills. Never change an existing project's instructions or overwrite another skill merely to satisfy an upstream path example. Transcript operations (`agent-transcripts`, `.cursor/projects/`) use only host-supported history access for the current project; do not guess paths or scan unrelated conversations. If unavailable, use the current conversation and user-supplied material, noting the missing history.

Discover suitable APIs or MCP tools first, dedicated browser automation second, and desktop control last. Check the existing project's verification commands before introducing new tools. `create-skill` maps to the host's skill-authoring facility, or the Agent Skills format. If `deslop`, `control-cli`, or `control-ui` from cursor-team-kit is absent, use the equivalent manual code review, real CLI test, or available UI tooling and state the substitution. A missing browser cannot count as visual verification.

Use GitHub CLI or a suitable connected forge API for authorized PR operations. Bugbot discussion can be read as ordinary PR comments; do not start or wait for a nonexistent Bugbot integration. Cursor-only features, including Cursor Automations, `SendToUser`, `update_state`, `api2.cursor.sh/automations`, cloud agent dashboards, and Grok Bot webhooks, are unsupported unless an actual equivalent integration is present and authorized. Benny and other Cursor automation packs are not included. Skip only independent optional steps; block steps whose required input or evidence is missing.

Use the native shell for ordinary commands. Quote absolute paths, including paths with spaces. Run bundled `.sh` scripts with an identified Bash executable (Git Bash on Windows), not by passing Bash syntax to PowerShell. Run Bun entrypoints with Bun and Node entrypoints with Node. Check prerequisites first; do not install dependencies or change `.env` files without authorization. Missing Bun, Bash, Java, browser tools, or model-checking tools blocks only the affected feature and must be reported. Keep credentials out of the repository and package.

## Thermos

Keep correctness/security and code-quality reviews separate until synthesis. Determine the actual requested base or PR base, then give both reviewers the same diff and relevant full-file context. Trace connected code as needed, but report defects introduced by the reviewed change, not unrelated pre-existing issues. Read PR discussion only after the independent audit when the rubric calls for it. No permission to publish comments is implied.

Return deduplicated findings with severity, file/line evidence, and remaining uncertainty. In a sequential fallback, do not describe passes as independent agents. Empty or clean diffs can produce no findings. Installing Thermos does not invoke it on every pstack task.
