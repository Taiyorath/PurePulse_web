# Copilot Instructions for PurePulse_web

## Project Overview
PurePulse_web is a Vite-powered React TypeScript application. The codebase is organized for modularity and scalability, with clear separation between UI pages, assets, and Firebase integration.

## Architecture & Key Components
- **src/pages/**: Contains main UI pages (`AuthPage.tsx`, `Dashboard.tsx`, `UserInfoForm.tsx`) and a multi-step profile setup flow (`ProfileSetup/`).
- **src/firebase/config.ts**: Centralizes Firebase configuration. All authentication and data operations should use this module for consistency.
- **src/assets/**: Static images for backgrounds and logos, referenced in UI components.
- **public/**: Publicly served assets (e.g., logo.png).
- **App.tsx / main.tsx**: Entry points for React app initialization and routing.

## Developer Workflows
- **Build**: Use `npm run build` to create a production build (see `vite.config.ts`).
- **Dev Server**: Use `npm run dev` for local development with hot reload.
- **Type Checking**: TypeScript is enforced via `tsconfig.json` and `tsconfig.app.json`.
- **Linting**: Run `npm run lint` (configured by `eslint.config.js`).
- **Testing**: No test files detected; add tests in `src/` and update this doc if testing is introduced.

## Patterns & Conventions
- **Component Structure**: Pages are React function components. Profile setup is split into steps (`Step1.tsx`, `Step2.tsx`) for clarity and reusability.
- **Routing**: All navigation logic is handled in `App.tsx` and/or `main.tsx`.
- **Firebase Usage**: Always import from `src/firebase/config.ts` for authentication and data access.
- **Styling**: Use CSS modules (`App.css`, `index.css`) for scoped styles. Avoid global styles unless necessary.
- **Assets**: Reference images from `src/assets/` for UI components; use `public/` for assets needed at root level.

## Integration Points
- **Firebase**: All backend interactions (auth, data) go through the config in `src/firebase/config.ts`.
- **Vite**: Build and serve via Vite (`vite.config.ts`).

## Examples
- To add a new page, create a React component in `src/pages/`, import it in `App.tsx`, and update routing.
- To use Firebase, import from `src/firebase/config.ts`:
  ```ts
  import { auth } from '../firebase/config';
  ```
- To add a new asset, place it in `src/assets/` and import in your component:
  ```ts
  import bg from '../assets/login-signup-bg.jpg';
  ```

## Additional Notes
- No custom test, deployment, or CI/CD scripts detected. Update this file if such workflows are added.
- Keep this file updated as project structure or conventions evolve.
