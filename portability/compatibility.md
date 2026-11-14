# Compatibility and limitations

| Host | Package | Deterministic checks | Live workflow qualification |
| --- | --- | --- | --- |
| Cursor | Original pstack and Thermos | Upstream manifests retained | Requires Cursor session |
| Claude Code | Existing pstack harness | Existing generated content retained | Pending local qualification |
| Codex desktop / CLI | pstacked and thermos marketplace packages | Windows local tests; three-OS CI | Both packages installed and enabled in Windows CLI 0.169.0-alpha.11.1. Live Thermos run blocked by Windows sandbox access. Desktop and full workflow checks pending. |
| Hermes Agent | Two generated external skill directories | Same package checks | Pending active profile qualification |
| Gemini CLI | Two generated extensions | Same package checks | Client not present on initial Windows PATH |

Update this table only with actual evidence. A passing generator test does not prove model behavior or external integrations. Platform CI checks packaging and scripts; it does not authenticate AI accounts.

## Capability policy

Native delegation and supported model overrides are used when exposed. Otherwise the adapter uses labelled sequential or inherited-model passes. Multiple passes on one model are not cross-family agreement. Worktrees provide local isolation, not a cloud machine. Transcript/history access is limited to the current project's supported host interface. Missing evidence cannot satisfy a verification gate.

Cursor Automations, Benny, cloud dashboards, Grok Bot services, and Cursor-specific hooks are not ported. The portable packages exclude automation packs. `cursor-team-kit` is not bundled; native review, shell, and UI verification tools may substitute for its companion skills only when they actually provide the required evidence.

Bun, Bash, Java/formal verification tools, browsers, GitHub authentication, and optional connectors are per-feature prerequisites. Missing optional tools do not prevent instruction-only use, but the affected task must be marked blocked or incomplete. Existing upstream failures must be distinguished from portability regressions.

The base upstream commit is recorded in release.json. Portable package versions are independent of upstream's plugin versions and are bumped when integrating updates. User model preferences survive package refreshes.
