@AGENTS.md

## Claude-specific notes

- Prefer `Edit` on existing files over regenerating them wholesale; never
  regenerate the images in `images/` unless asked.
- Canvas APIs don't exist in the jsdom test environment — don't try to test
  `loadImageData` there; verify it manually via `npm run dev` instead.
- When finishing a task, run `npm run typecheck && npm test`, and if you
  touched `vite.config.ts`, `package.json`, or anything under `src/`, also
  confirm `npm run build` still succeeds.
