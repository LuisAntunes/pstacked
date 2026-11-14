# Codex adapter

Read [shared host rules](common.md) once per session and apply them to each invocation. Package-local paths are relative to this file, including in plugin cache copies. The model file is `$CODEX_HOME/pstacked-models.md`, or `~/.codex/pstacked-models.md` when CODEX_HOME is unset. Read it explicitly for pstack role selection; do not alter config.toml to implement role preferences.

| Upstream facility | Codex mapping |
| --- | --- |
| `Task` | Use the available native `spawn_agent`/collaboration tools. Load the packaged role brief into the worker prompt. Omit unsupported model fields. |
| Wait, message, stop | Use the actual wait/send/interrupt/close tools exposed by the session. Wait for completion, not just a spawn acknowledgement. |
| `AskQuestion` | Use request_user_input when available and appropriate; otherwise ask in text. Respect plan-mode and permission-specific restrictions. |
| todolist | Use the native plan tool if available; otherwise maintain a short checklist in the conversation. |
| `Grep`, `Glob`, `Read`, `Bash` | Native file/shell tools, normally rg for search. Shell syntax must match the active shell. |
| `generalPurpose`, named reviewers | A permitted native agent type plus the full packaged role brief; do not assume a custom type has been registered. |
| Model selection | Inherit unless the current tool schema permits an explicitly configured available model and effort. Some surfaces require a fresh-context worker for overrides. Follow that schema. |
| Skill invocation | Use the displayed skill selector or `$skill-name`, or read the local SKILL.md directly. Package names are pstacked and thermos; upstream skill names are retained. |
| Project-created skills | `.agents/skills/<name>/SKILL.md`. Do not copy this plugin into that shared directory. |

Codex desktop and CLI expose different tool schemas. Discover capabilities in the running session, not from a hard-coded function signature. Honor restrictions on proactive delegation. Never use new user-owned chats as a substitute for subagents. Do not turn a local worktree into a claim of Codex cloud execution.

`poteto-mode` and `thermos` retain upstream explicit-invocation policy through agents/openai.yaml. Installing the plugins does not activate those modes, replace Ponytail, or change user instructions. When explicitly invoked, keep mode behavior within the current session until the user exits it.

References: [skills](https://developers.openai.com/codex/skills), [subagents](https://developers.openai.com/codex/subagents), [plugins](https://developers.openai.com/plugins/build/plugins).
