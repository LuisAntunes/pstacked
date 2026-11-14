# Hermes Agent adapter

Read [shared host rules](common.md) before following the skill. The personal model file is `$HERMES_HOME/pstacked-models.md`, or `~/.hermes/pstacked-models.md` when HERMES_HOME is unset. It is read explicitly; never rewrite config.yaml or provider credentials during model setup.

| Upstream facility | Hermes mapping |
| --- | --- |
| `Task` | `delegate_task` if available. Supply the complete role brief, task context, and absolute skill paths. Use only fields in its current schema. |
| Background work | Follow the delegation tool's returned handle/completion mechanism. A worker waits for its bounded commands before returning; it does not transfer process ownership by returning a PID. |
| Models | Inherit the session model by default. Use a configured model override only if the delegation schema and authorized runtime support it. |
| `AskQuestion` | Ask in the conversation unless a native structured-question tool is exposed. |
| todolist | Native planning tools if available, otherwise a short conversational checklist. |
| Read/search/execute | Native file and terminal tools. Keep the runtime's real path and shell conventions. |
| Skills | `skills_list` and `skill_view` when available, or read the complete installed SKILL.md. Use actual discovered names. |

Install these generated skills through the isolated external skill directories documented in the installation guide. Keep the full package layout so references to docs and agents resolve. Do not mix Codex-adapted copies into Hermes' discovery paths. For Docker, paths must be inside the running container and mounted there; a Windows host path is not a container path.

External skill directories are not a write-protection boundary. Do not use skill_manage or automatic reflection to rewrite generated package copies. Propose changes against the fork's source and regenerate them. The user may mount packages read-only. The review agents do not spawn nested agents unless explicitly authorized.

If delegation or a toolset is disabled, apply the shared sequential fallback. Do not silently enable providers, change profiles, or install unrelated toolsets. Retain upstream explicit activation for poteto-mode and thermos through their descriptions and the user's invocation; discovery alone does not activate a mode.

References: [skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills), [delegation](https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation).
