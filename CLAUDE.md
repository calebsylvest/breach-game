# BREACH

Top-down isometric real-time shooter for Vibe Jam 2026. Single-player roguelite, browser-only, built in Three.js.

## Read first
- `docs/BREACH_PRD.md` — product spec, authoritative
- `docs/TASKS.md` — task planner, current build status
- `.claude/memory/MEMORY.md` — persistent project memory (user / feedback / project / reference)

## Memory convention

All persistent memory for this project lives under `.claude/memory/` in this repo, **not** in the global `~/.claude/projects/.../memory/` path. When saving a memory:

1. Write the memory file to `.claude/memory/<name>.md` with the standard frontmatter (`name`, `description`, `type`).
2. Add a one-line pointer to `.claude/memory/MEMORY.md` so the index stays current.
3. Commit memory updates with the rest of the change (memory is versioned like code).

Same for task tracking: keep the human-readable plan in `docs/TASKS.md` and update it as phases land.

## Stack

- Vite + TypeScript strict (`tsconfig.json`)
- Three.js r183 with procedural geometry (no asset loading)
- Web Audio for all sound (synthesized)
- Dev server: `npm run dev`
- Type check: `npx tsc --noEmit`

## Workflow

- Build in phases, one committed milestone at a time.
- Verify each phase in the Chrome tab via `window.__BREACH__` before committing.
- Prefer editing existing files; don't add speculative abstractions or comments.
