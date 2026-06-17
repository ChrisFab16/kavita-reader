# Upstream contribution policy (agents)

**Canonical doc:** [docs/upstream-contribution.md](../../docs/upstream-contribution.md)  
**Effective:** 2026-06-16

## Dual-branch model

| Branch | Use |
|--------|-----|
| **`speckit-work`** | Full Spec Kit tree — default for specify/plan/tasks/implement on the fork |
| **`fix/login-credential-handling`** (or future upstream PR branches) | App code + `specs/contracts/` only — what we offer cbytestech/kavita-reader |

## Rules when targeting upstream

1. **Always update `specs/contracts/`** when Kavita API client behavior changes — contracts merge upstream; feature specs do not.
2. **Do not add** `.specify/`, `.cursor/speckit-*`, or `specs/00N/` to upstream PR branches unless the maintainer requests process docs.
3. **Preserve `speckit-work`** — never force-push it away; it is the archive of feature artifacts.
4. **Test fixtures** belong under `src/test-fixtures/`, not under `specs/<feature>/fixtures/`, if they must ship upstream.
5. Before opening upstream PR: slim `AGENTS.md` to contracts + Context7 (see `fix/login-credential-handling`).

## Fork-only Spec Kit

On `speckit-work`, the full workflow in [change-policy.md](./change-policy.md) still applies.

When work is ready for upstream: merge/cherry-pick `src/` + `specs/contracts/` to the PR branch; run cleanup only if feature dirs were accidentally included.

## Reference

- Cleanup commit: `4df4b2a`
- Upstream PR: https://github.com/cbytestech/kavita-reader/pull/5
- Full tree branch: `origin/speckit-work`
