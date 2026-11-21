# Decisions

Each task records what we chose, what else we considered, and why.

---

## D0: Which repository to build on

**Choice:** Build The Bug Bazaar in this repository (`transformation-assignments`), on a new branch `feature/bug-bazaar`, keeping all existing history.

**Considered:**
- Starting from the Week 1 `bug-bounty-starter` folder.
- Creating a new repository.

**Why:** The Week 1 Bug Bounty Board was not built. The starter only contains an empty `App` component and a three-item mock, so there is no feature code to carry over. The evaluator asked us to continue in the same repository rather than create a new one, so this repo (already on GitHub with history) is the base. The concepts from the Week 1 missions (loading and error states, derived values, controlled forms, immutable updates, a not-found route) are all covered again in the Bug Bazaar tasks.

**Branching:** All week's work goes on `feature/bug-bazaar`, pushed daily, with one pull request into `main` at the end of the week.

---

## D1-3: TypeScript in strict mode

**Choice:** TypeScript 6 with `strict: true`, plus `erasableSyntaxOnly` (bans `enum`, `namespace` and constructor parameter properties, so every TS feature we use is "types only" and disappears at build time) and `verbatimModuleSyntax` (type-only imports must say `import type`). ESLint fails the build on `any` and `@ts-ignore`.

**Contract types:** `src/types/api.ts` mirrors the shared contract. Union types such as `Category` are derived from `as const` arrays, so the list we loop over in the UI and the type can never drift apart.

**Request status:** `RequestState<T>` in `src/types/request.ts` is a discriminated union (`idle | loading | success | error`). Separate booleans (`isLoading`, `isError`, `data`) allow 8 combinations, most of them impossible (loading *and* error). The union allows exactly the 4 real ones, and TypeScript only lets us read `data` after checking `status === 'success'`.

**Considered:** TypeScript 7 (the new native compiler) was released, but `typescript-eslint` only supports up to 6.0, so we stay on 6. Looser settings (`strict: false`) would make migration faster but hide the bugs strict mode exists to catch.
