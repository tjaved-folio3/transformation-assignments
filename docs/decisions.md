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
