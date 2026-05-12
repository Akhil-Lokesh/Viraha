# CLAUDE.md
# Scaffold: get-shit-done-cc | Plugins: superpowers, context-mode, claude-mem

---

## Project

- **Name:** Viraha
- **Stack:** Next.js 14+, Express 5.2, PostgreSQL + PostGIS, Redis, Cloudflare R2, Prisma ORM, TypeScript
- **Stage:** MVP — Phase 1 complete, Phase 2 in progress (~75%)
- **Goal:** Ship production-ready MVP of the travel memory platform (Letterboxd for travel)

---

## Rules Index

Detailed instructions are split into focused files in `.claude/rules/`:

- `context-modes.md` — planning, coding, debug, review mode definitions
- `memory-protocol.md` — claude-mem session conventions and key schema
- `task-format.md` — BUILD / FIX / PLAN / REVIEW / REFACTOR task prefixes

---

## Execution Principles

- **Do the work, don't describe the work.** Produce code, not summaries of what the code will do.
- **Minimal output by default.** No preamble. No "Great, here's what I'll do." Just do it.
- **No unnecessary options.** Make a choice. Don't present three alternatives and ask me to pick.
- **Finish what you start.** No `// TODO: implement this` unless I explicitly ask for a stub.
- **Ask once, clearly.** If you need clarification, ask one specific question.
- **Match length to complexity.** Short tasks get short answers.
- **Tests are part of the work.** Include tests on non-trivial builds unless told otherwise.

---

## Superpowers

Use `/think` when extended reasoning will improve the output.

Apply it before:
- Implementing logic that touches more than two interacting systems
- A debugging session with no obvious root cause
- Writing code with meaningful edge cases to consider upfront
- Beginning a review sweep

Do not use for: simple lookups, straightforward CRUD, or any task where the output is obvious.

**Standing trigger:** If a task spans more than two interacting systems, or a debugging session has cycled through two or more hypotheses without resolution, apply `/think` without being asked.

---

## Do Not

- Do not use `console.log` for debugging in committed code.
- Do not leave TypeScript `any` types unless I have explicitly accepted them.
- Do not add dependencies without flagging it first.
- Do not create files in unexpected locations — ask if uncertain where something belongs.
- Do not summarize what you just did at the end of a response unless I ask.

---

## Multi-Agent Swarm Protocol

When the task is broad enough to parallelize (codebase audit, multi-cluster refactor, multi-area fix), use the wave pattern:

- **Wave 1 — Discovery**: 4–6 audit agents in parallel (architect, code-reviewer, security-reviewer, frontend-reviewer, tdd-guide, integration-checker). Each writes findings to `.swarm/wave1/<scope>.md`. Synthesize into `.swarm/wave1/SYNTHESIS.md` with CRITICAL → LOW clusters.
- **Wave 2 — Fix**: dispatch 5–7 fixer agents in parallel, one per cluster, strict file-scope ownership, atomic commit per agent. Files must be disjoint across agents to avoid stage collisions.
- **Wave 3 — Review**: 3 reviewer agents in parallel re-audit each Wave 2 commit. Look for "fix introduced a new bug" — different lens than "did the original bug get closed."
- **Wave 3.5 — Follow-up fixes**: targeted single agent to close findings from Wave 3.
- **Wave 4 — Self-improvement**: capture lessons in `.swarm/learnings/`, update agent definitions, update CLAUDE.md.

**Rules** (see `.swarm/learnings/multi-agent-protocol.md` for full context):

1. **Grep-verify before fixing**. If an audit asserts a cross-cutting fact, the fixer must grep to confirm and is allowed to skip the fix if reality disagrees.
2. **Never assert facts in prompts you haven't verified**. Distinguish requirement, constraint, and current-state in the prompt.
3. **Strict file-scope ownership in Wave 2**. No agent does `git add -A`. Each agent stages only its own files.
4. **Worktree isolation** for any wave with > 3 parallel writers on shared code.
5. **Always run Wave 3 review** — fixers regularly introduce silent regressions that pass tsc + tests.
6. **Reviewer prompts must include**: (a) does fix close original bug? (b) what adjacent case did the fix break? (c) what assumption did the fixer make that wasn't true?
7. **Enumerate naming variants** in any rejected-values list (`changeme`, `change_me`, `change-me`, …).

---

## Quick Reference

```bash
# Session start
/mem recall project
/mem recall session.last && /mem recall session.next
/context switch [planning|coding|debug|review]

# Extended reasoning
/think

# Save a decision
/mem save decision.<topic> "<decision + reason>"

# Session end
/mem save session.last "<completed>"
/mem save session.next "<next action + file path>"
/mem list
```
