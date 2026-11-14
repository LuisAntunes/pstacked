# Agreed requirements

1. Maintain the public GitHub fork `LuisAntunes/pstacked` and local clone `C:\Users\Luis Antunes\Main\Coding Projects\pstacked`, retaining the `cursor/plugins` upstream relationship and history.
2. Adapt only pstack and Thermos plus necessary shared packaging, validation, and update tooling. Do not install or customize unrelated plugins.
3. Preserve upstream Cursor behavior and the existing pstack Claude Code package. Preserve each component's license and attribution.
4. Generate complete Codex, Hermes, and Gemini packages from shared sources. Keep agents, scripts, references, and guides together. Never hand-edit generated files.
5. Prioritize Codex desktop/CLI on Windows. Validate deterministic generation on Windows, Linux, and macOS. Record live host checks separately and do not claim untested runtime parity.
6. Install both Codex packages at user scope without activating modes automatically or replacing existing preferences, plugins, or instructions.
7. Use each host's native tools. Only select models and reasoning settings available in that session. Store role preferences outside the repository and package, asking before saving them.
8. Label fallback sequential/same-model work honestly. Block dependent steps if required evidence is unavailable. Do not claim Cursor cloud or automation features have been ported.
9. Keep Thermos separately invocable. Preserve independent correctness/security and code-quality passes, changed-code scope, evidence, and deduplicated findings. Reviews do not authorize edits or external publication.
10. Integrate upstream through a weekly reviewable PR and a manual trigger. Preserve custom source changes, stop on conflicts/human edits, run checks explicitly, and never auto-merge main.
11. Document installation, prerequisites, updating the local clone and installed packages separately, rollback, and removal.
12. Reuse existing dependencies. Preserve user services and unrelated configuration. Add no orchestration service, paid API requirement, credential store, or new third-party runtime dependency.

Delivery order: foundation; Codex Windows; cross-platform and existing-host validation; Hermes live qualification; Gemini live qualification. Generated adapters for later hosts can be reviewed and tested before those clients are available, but they are not evidence of live support.
