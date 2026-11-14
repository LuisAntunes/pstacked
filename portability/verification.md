# Live verification scenarios

Run against an isolated fixture or read-only context. Record host version, installed package version, prompt, observed behavior, and limitations. Do not use production branches to test edits, publication, or cleanup.

## Discovery and setup

Verify pstacked and thermos appear once in the native catalog, installed from this fork. Open a fresh session and explicitly select setup-pstack. Confirm it reads the Codex adapter, offers inherited or available models, and asks before saving preferences. Decline saving for the smoke test. Verify no general configuration or personal instruction was changed.

## Investigation and delegation

Use poteto-mode for a read-only explanation of a small fixture repository. Ask for one native delegate to inspect an independent part. The parent must pass the installed paths, collect the result, and verify it. Repeat with delegation unavailable: it should disclose sequential work, not invent a worker.

## Bug fix

Create a temporary repository containing a small function and a failing behavior test. Invoke poteto-mode to fix it. Confirm the agent reproduces the failure, makes the small fix, runs the test, and does not commit or push without authorization. Require only available verification tools.

## Thermos

Use a fixture diff that introduces a boundary-condition defect while leaving a separate pre-existing issue unchanged. Invoke thermos for read-only review. Both review rubrics must be loaded; findings must cite the introduced defect with evidence, avoid reporting the untouched issue as new, and merge duplicates. Run an empty-diff case and confirm it does not invent findings. Repeat without delegation and inspect the disclosed limitation.

## Missing dependencies and isolation

Request a feature requiring an unavailable model family, browser, or Bun runtime. Expect an explicit limitation and no false verification. Check git status and hashes of unrelated settings before/after install, update and removal. Do not change credentials, .env files, host trust, or permissions as a test shortcut.

## Release evidence

Store concise results in compatibility.md, linking the GitHub Actions run for deterministic cross-platform checks. Keep raw traces and account-specific test artifacts outside the public repository.
