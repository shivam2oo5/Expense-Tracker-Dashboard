INTERN ID: CITS6183
# Expense Tracker Dashboard

Expense Tracker  is a premium personal finance tracking application. It runs completely client-side in the browser, storing all data securely in local storage.

## Run & Operate

- `pnpm run dev` — starts the development server (port 5173 by default)
- `pnpm run build` — compiles code and builds the app for production (output in `dist/public`)
- `pnpm run serve` — previews the production build locally
- `pnpm run typecheck` — runs typescript diagnostics

## Stack

- Node.js 24, Vite 7, TypeScript 5.9
- Styling: Vanilla CSS (responsive, premium glassmorphism theme)
- Icons: Font Awesome 6
- Animations: GSAP, AOS
- Charts: Chart.js
- Local Storage helper for budget and transaction history

## Directory Structure

- `index.html` — The main HTML structure
- `js/` — Client-side application logic (transactions, budget, analytics, UI components, chart drawing)
- `css/` — Modular stylesheet breakdown (variables, resets, layout, components, responsiveness)
- `data/` — Local data definitions (e.g. categories)
- `public/` — Static assets (favicon, images)
