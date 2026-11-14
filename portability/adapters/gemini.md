# Gemini CLI adapter

Read [shared host rules](common.md) before following the skill. The personal model file is `~/.gemini/pstacked-models.md`. Read it explicitly. Do not alter settings.json, GEMINI.md, model routing, or provider credentials to store plugin role choices.

| Upstream facility | Gemini CLI mapping |
| --- | --- |
| `Task` | Use available native subagent/delegation tools with the packaged role brief. Do not assume Cursor custom types or arbitrary model overrides exist. |
| Models and effort | Inherit the active model unless the current delegation schema exposes an available configured override. Do not translate Cursor effort suffixes into unsupported Gemini fields. |
| `AskQuestion` | Use the exposed structured question tool, or ask in text when absent. |
| todolist | Native todo tool if available; otherwise a short checklist. |
| `Bash`, `Read`, `Grep`, `Glob` | Native shell and file tools. Use the actual shell and quote paths. |
| Skills | Discover with `/skills list` and activate by the catalog name or read the installed SKILL.md. |
| New project skills | `.gemini/skills/<name>/SKILL.md`; preserve unrelated `.agents/skills` entries. |

Install the full generated package as a Gemini extension, not a set of loose symlinks whose resources are missing. Both extensions keep upstream skill names, so avoid simultaneous duplicate pstack or Thermos installations. Do not enable experimental subagents or change trust policies automatically. If delegation is unavailable, use the shared sequential fallback. Neither installing an extension nor listing skills activates poteto-mode or thermos.

References: [skills](https://geminicli.com/docs/cli/skills/), [subagents](https://geminicli.com/docs/core/subagents/).
