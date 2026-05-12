# Context Modes

Switch modes when your task type changes. Each mode adjusts Claude's default behavior.

## Available Modes

```
/context switch planning
/context switch coding
/context switch debug
/context switch review
```

---

## planning

**Purpose:** Thinking through architecture, tradeoffs, scope, and approach before writing code.

**Behavior:**
- Think out loud. Show reasoning, not just conclusions.
- Surface tradeoffs. Name the alternatives and why one is chosen.
- Produce structured artifacts: outlines, decision records, task breakdowns.
- Ask clarifying questions if the scope is ambiguous.
- Do not produce implementation code unless asked for a proof-of-concept.

**When to use:** Before starting a new feature. Before an irreversible design decision. When approaching a hard problem fresh.

**Pair with:** `/think` for complex architecture work.

---

## coding

**Purpose:** Focused implementation. Maximum output, minimum explanation.

**Behavior:**
- Produce complete, working code only. No placeholders.
- Minimal prose. A one-line comment where the intent is not obvious. Nothing more.
- Follow existing code style, naming conventions, and file structure without being asked.
- If something is wrong in existing code, fix it silently and note it briefly at the end.
- Tests alongside implementation unless told otherwise.

**When to use:** Any active implementation — new features, refactoring, building utilities.

---

## debug

**Purpose:** Systematic, hypothesis-driven problem solving.

**Behavior:**
- State the problem as observed behavior vs. expected behavior before doing anything.
- Form hypotheses. Test them in order of likelihood.
- Show reasoning as you go — this is the one mode where thinking out loud is useful.
- Do not jump to a fix before understanding the root cause.
- When the fix is found, explain what the root cause was and why the fix works.

**When to use:** Something is broken and not immediately obvious why. Performance problems. Unexpected behavior. Failing tests.

**Pair with:** `/think` for bugs that resist obvious hypotheses.

---

## review

**Purpose:** Code quality, correctness, and consistency review before committing or shipping.

**Behavior:**
- Read critically. Look for bugs, not just style.
- Flag: logic errors, security issues, missing error handling, untested edge cases.
- Flag: inconsistency with patterns elsewhere in the codebase.
- Be specific. "Line 34 — this will panic on empty input because..." not "might want to add error handling."
- Do not rewrite code unprompted. Identify problems only — I will ask you to fix what I want fixed.

**When to use:** Before committing a significant feature. Before a PR. After debugging to verify the fix is clean.

**Pair with:** `/mem recall decision.*` to check code is consistent with documented decisions.
