# Multi-Agent Swarm Protocol — Lessons from Wave 1 → 3.5

Captured 2026-05-12 from the first full pass of the parallel-fixer pattern on Viraha (branch `mvp/stabilize-auth-post-feed-profile`).

Findings ordered by frequency-of-pain.

---

## 1. Always grep-verify ground truth BEFORE applying a fix

**What happened**: The architect's audit (Wave 1) flagged finding `H3` — "Followers / Following endpoints take a UUID param but frontend sends username." That assertion was *plausible* given the codebase's username-keyed profile routes, but the fixer (Wave 2 Agent #3) ran `grep -rn "followers\|following" frontend/src/lib/api/` and found the frontend actually sends UUID. The architect was wrong. The fixer correctly *skipped* the planned route change.

**Rule**: Before any fix that depends on a cross-cutting fact (route shapes, callers, env vars, exported symbols), run a grep to confirm. Time cost is ~5 seconds. Risk avoided: shipping a "fix" that breaks a working contract.

**Prompt pattern**:
> Before applying the route rename, verify by greping the frontend caller. If the frontend already sends UUID, skip this fix and report.

Give the fixer explicit permission to skip if the fact doesn't hold. Default behaviour of "follow the plan literally" causes shipping wrong fixes.

---

## 2. Reviewers catch silent regressions that fixers miss

**What happened**: Wave 2 Agent #7 (security) removed `'style'` from DOMPurify `ALLOWED_ATTR` to close an XSS vector. The agent's commit message claimed "`data-text-align` retained for the rich-text editor." That claim wasn't verified. Wave 3 security reviewer dug into `node_modules/@tiptap/extension-text-align/dist/index.js` and discovered Tiptap writes `style="text-align: X"` directly — `data-text-align` is never produced. **Removing `style` silently broke text alignment for every stored journal entry.** The Wave 2 commit looked clean (tsc green, no runtime error in unit tests) but introduced a content rendering regression.

**Rule**: Run a Wave 3 review pass after every Wave 2 fix wave. The reviewer's job is specifically to look for "fix introduced a new bug" — different lens than "did the original bug get closed."

**Reviewer prompts** should always ask:
- Does the fix work for the documented case?
- Did the fix break any adjacent case (rendering, integration, downstream caller)?
- What did the fixer assume that wasn't true?

---

## 3. Never assert facts in prompts you haven't personally verified

**What happened**: My prompt to Wave 2 Agent #1 said "the [logout] handler already gracefully handles missing `req.user` (it does — it just clears the refresh token cookie + DB row, both guarded by `if (refreshToken)`)." That was a guess. The agent applied the fix, then noticed the handler still referenced `req.user!.userId` inside the `if (refreshToken)` block — would crash under `optionalAuth`. Agent #1 deviated from my plan and made the handler genuinely null-safe.

**Rule**: When briefing an agent, distinguish between:
- "Here's the requirement" (always assert)
- "Here's the constraint" (always assert)
- "Here's what the current code does" (read it before asserting, or write "verify before assuming")

If I haven't read line N today, I shouldn't claim what's on line N to an agent.

**Counter-example to remember**: The architect couldn't write its own findings file because its agent definition only granted Read/Grep/Glob. I had to manually transcribe the findings. **Always check tool grants before delegating a write-target task.**

---

## 4. Parallel writers on shared trees collide

**What happened**: Wave 2 dispatched 7 fixer agents in parallel, all writing to the same repo. Agent #5 (code hygiene) and Agent #6 (UX nav) operated on overlapping concerns but distinct files. When Agent #5 ran `git add` for its files, Agent #6's already-staged work-in-progress got committed under Agent #5's commit. The work is preserved (no data loss) but the commit history attributes the wrong message to several diffs. Agent #6 finished, ran git status, found nothing to commit, and correctly reported "all my fixes are in HEAD." Functional outcome: fine. Hygiene outcome: messy commit history.

**Rule**: For parallel agents on shared trees, use one of:
- **Worktree isolation** (`isolation: "worktree"` on Agent tool) — each agent gets its own copy of the tree. Best for any agent that mutates state.
- **Strict file-scope ownership** + atomic commit: each agent runs `git add <only-its-files>` then `git commit`, never `git add -A` or `git add .`.
- **Serial commits**: dispatch fixers in batches, never two simultaneously editing the same dir.

For Wave 2 the file scopes were disjoint by design, but the timing of `git add` cycles still allowed cross-pollination because the staging area is a single shared resource. Worktree isolation would have prevented this entirely.

---

## 5. Naming-convention drift hides security gaps

**What happened**: Wave 2 Agent #7 added `CSRF_SECRET` placeholder validation to `env.ts`. The `PLACEHOLDER_SECRETS` list contained `'changeme'`. Wave 3 security reviewer noticed: an operator setting `CSRF_SECRET=CHANGE_ME_padded_to_32chars` would BYPASS the check because `'change_me'` (with underscore) is not in the list. One placeholder variant, different convention.

**Rule**: When defining "rejected values" lists (placeholders, dangerous tokens, banned imports), enumerate the *naming variants* and add them all:
- `changeme`, `change_me`, `change-me`, `change me`
- `placeholder`, `your_secret_here`, `replace_me`

This is exactly the kind of edge case the review pass exists to catch.

---

## 6. Inventory before you act on stale recommendations

**What happened**: One Wave 2 finding recommended adding `Bookmark` icon to sidebar "between Journals and Atlas." Reality: the sidebar already had `Journeys` and `Atlas`; the correct placement was between `Journeys` and `Atlas`. The Wave 3 reviewer caught and verified the actual placement. The agent doing the fix saw the existing structure and placed it correctly anyway. **The plan was slightly stale; the agent corrected silently.** Good outcome, but document the pattern: an agent given a stale plan should adapt to current state, not slavishly follow the doc.

---

## Concrete deliverables from this learning pass

1. ✅ Granted `Write` and `Bash` tools to `.claude/agents/architect.md` (was Read/Grep/Glob only).
2. ✅ Created three new specialist agents earlier in this session: `frontend-reviewer`, `integration-checker`, `perf-reviewer` (all have Read/Grep/Glob/Bash).
3. ✅ Added `Write` tool to `.claude/agents/planner.md`.
4. ✅ This file documents the protocol.
5. ⏳ Update CLAUDE.md with a short Multi-Agent Swarm section so future sessions remember.

## Cost / latency notes

- 6 audit agents in Wave 1 took ~5–10 min wall-clock to all complete (parallel).
- 7 fixer agents in Wave 2 took ~5 min wall-clock.
- 3 reviewer agents in Wave 3 took ~5 min wall-clock.
- Total wall-clock for full Wave 1→3.5 cycle: ~30–40 min.
- Token spend per agent: 50k–180k.
- All 7 Wave 2 fixers produced atomic, type-checked commits.

The "well-oiled machine" the user asked for is real: parallel fan-out → parallel fan-out → review → targeted follow-up. The trick is that each wave needs scoped prompts and the orchestrator must not assert unverified facts.
