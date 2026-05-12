# Task Format

Use these prefixes when giving tasks. Match output type to the prefix.

---

## Prefixes

```
BUILD:    <implementation task>
FIX:      <bug or broken behavior>
PLAN:     <design or architecture question>
REVIEW:   <code or approach to assess>
REFACTOR: <code to improve without changing behavior>
```

---

## Expected Output Per Type

**BUILD** — produce complete, working code. No stubs, no placeholders. Tests included unless told otherwise.

**FIX** — debug systematically. State observed vs. expected behavior first. Explain the root cause. Then fix it.

**PLAN** — structured analysis only. No implementation code unless explicitly asked for a proof-of-concept. Produce outlines, tradeoff comparisons, or decision records.

**REVIEW** — critical assessment with specific findings. File path and line number where possible. Do not rewrite — identify only.

**REFACTOR** — improve without changing behavior. Call out any behavior change that turns out to be unavoidable before making it.

---

## No Prefix

If no prefix is given, infer the type from context and proceed. Do not ask for a prefix.
