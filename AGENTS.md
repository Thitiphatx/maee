# Repository Guidelines

## Project Structure

This is a React 19 + TypeScript progressive web app built with Vite. `src/App.tsx` coordinates screens; each screen lives in `src/pages/<page-name>/<page-name>.tsx` (for example, `src/pages/home/home.tsx`). Page-specific components belong in that page's `components/` subfolder. Shared browser behavior is in `src/hooks/`, shared types in `src/types.ts`, and styles in `src/index.css` and `src/App.css`. Image assets are in `src/assets/`; PWA metadata, icons, and the service worker are in `public/`. There is no test directory.

## Build, Test, and Development

Use Bun, matching the checked-in `bun.lock`:

- `bun install` installs dependencies.
- `bun run dev` starts the local Vite development server with hot reload.
- `bun run build` runs TypeScript project checks and creates the production build in `dist/`.
- `bun run lint` runs ESLint across the repository.
- `bun run preview` serves the production build locally for a manual check.

No automated test command is configured. Run build and lint checks before submitting, and manually exercise affected screens.

## Coding Style

Write UI and browser logic in TypeScript/TSX. Follow the existing style: two-space indentation, single quotes, no semicolons. Use PascalCase for React components, camelCase for functions and variables, and PascalCase for types and interfaces. Keep page UI in `src/pages/<page>/<page>.tsx`, page props in the sibling `interface.ts`, and page-specific components in that page's `components/` folder. Prefer Tailwind utility classes for styling; reserve inline styles for values that must be computed at runtime. Put shared browser logic in hooks and shared types in `src/types.ts`. ESLint enforces TypeScript, React Hooks, and React Refresh rules; fix lint errors rather than suppressing them.

## Testing Guidelines

No test framework or coverage threshold is configured. Run `bun run lint` and `bun run build`. Manually verify affected flows, especially camera permissions and file-input fallback for camera changes, and responsive/PWA behavior for app shell changes.

## Commits and Pull Requests

Recent history uses short, imperative Conventional Commit subjects, such as `feat: first design ux/ui`; follow that pattern (`fix: handle camera fallback`). Pull requests should explain the user-visible change, list checks performed, link a related issue when one exists, and include screenshots for visual changes. Call out any browser permissions, offline behavior, or data-storage implications.

## Product Constraints

Keep the app local-first and low-effort: a photo is the main record, with optional short text. Photos, notes, and search vectors belong in IndexedDB; image and query vectors are computed on-device with Transformers.js. The multilingual Jina CLIP model is downloaded and cached on first activation (about 850 MB) and is licensed for non-commercial use. Avoid adding categories, location fields, or server-dependent features without an explicit product decision. Preserve backup considerations when changing storage behavior.
