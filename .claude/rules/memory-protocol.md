# Memory Protocol

Conventions for using claude-mem across sessions.

---

## Session Start

Recall context in this order at the start of every session:

```
/mem recall project
/mem recall session.last
/mem recall session.next
/mem recall decision.*
```

---

## During Work

Save decisions as you make them, not after:

```
/mem save decision.<topic> "<the decision and its reason>"
/mem save blocker.current "<description of what is blocking>"
```

---

## Session End

Before closing, always save:

```
/mem save session.last "<what was completed this session>"
/mem save session.next "<exact next action + file path if known>"
/mem delete blocker.current
```

Then run `/mem list` and delete any keys that are stale or resolved.

---

## Key Schema

| Namespace          | Purpose                                      | Lifespan   |
|--------------------|----------------------------------------------|------------|
| `project.*`        | Stack, goals, constraints — core facts       | Permanent  |
| `decision.*`       | Architecture and design choices with reasons | Long-term  |
| `session.last`     | What was completed last session              | Overwrite  |
| `session.next`     | Exact next action with file path if known    | Overwrite  |
| `blocker.*`        | Active blockers — delete on resolution       | Short-term |

---

## Example Keys

```
project.name         "MyApp"
project.stack        "Next.js 14, Postgres, Drizzle ORM, Tailwind"
project.goals        "MVP by end of month — auth + core CRUD"
project.constraints  "No external auth providers, mobile-first"

decision.auth        "JWT, not sessions — stateless API requirement"
decision.db.schema   "users → posts → comments, soft deletes on all"
decision.error       "Centralized error handler at middleware level"

session.last         "Built user model, auth endpoints, wrote tests"
session.next         "Post creation endpoint — src/routes/posts.ts"

blocker.current      "CORS issue on /api/auth/refresh"
```

---

## Rules

- Store the reason alongside every decision, not just the choice.
- Delete `blocker.current` immediately on resolution — do not leave stale blockers.
- Keep memory lean. More keys is not better. Run `/mem list` at session end and prune.
