# Your First Pull Request

This step-by-step guide walks you through submitting your first PR to Nexu. No prior open-source experience required — just a GitHub account and a code editor.

## Before You Start

Make sure you have:

- A [GitHub](https://github.com) account
- [Git](https://git-scm.com/) installed
- [Node.js](https://nodejs.org/) 24+ (LTS recommended)
- [pnpm](https://pnpm.io/) 10.26+ (`corepack enable && corepack prepare pnpm@latest --activate`)

## Step 1 — Find an Issue

Browse issues labeled [`good-first-issue`](https://github.com/nexu-io/nexu/labels/good-first-issue) or [`help-wanted`](https://github.com/nexu-io/nexu/labels/help-wanted). These are curated for new contributors with clear scope and estimated effort.

Issues marked with [`mentor-available`](https://github.com/nexu-io/nexu/labels/mentor-available) have a maintainer ready to guide you through the process.

**Comment on the issue** to claim it — a simple "I'd like to work on this" is enough. A maintainer will assign it to you.

## Step 2 — Fork and Clone

```bash
# Fork via GitHub UI (click the "Fork" button), then:
git clone https://github.com/YOUR_USERNAME/nexu.git
cd nexu
```

## Step 3 — Set Up the Development Environment

```bash
pnpm install
pnpm --filter @nexu/shared build
```

Verify everything works:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Step 4 — Create a Branch

Use a descriptive branch name with a conventional prefix:

```bash
git checkout -b fix/sidebar-alignment
# or: feat/model-search, docs/seedance-faq, chore/update-deps
```

## Step 5 — Make Your Changes

Open your editor and start coding. A few tips:

- **Keep changes focused** — one logical change per PR
- **Follow existing patterns** — look at nearby code for style conventions
- **Run checks often** — `pnpm lint && pnpm typecheck` catches issues early
- If you touched API routes/schemas: run `pnpm generate-types`
- If you touched docs: run `cd docs && pnpm dev` to preview locally

## Step 6 — Commit

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "fix: align sidebar collapse button padding"
```

Common prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`

## Step 7 — Push and Open a PR

```bash
git push origin fix/sidebar-alignment
```

Then go to your fork on GitHub — you'll see a banner suggesting to open a PR. Click it.

### Fill in the PR template

- **What** — One-liner summary of your change
- **Why** — Link the issue with `Closes #123`
- **How** — Brief description of your approach
- **Affected areas** — Check the relevant boxes
- **Checklist** — Verify all items pass

### PR title

Use the same Conventional Commits format: `fix: align sidebar collapse button padding`

## Step 8 — Wait for Review

A maintainer will review your PR **within 48 hours**. Here's what to expect:

1. **CI checks run automatically** — typecheck, lint, build, and ESM import verification
2. **A maintainer reviews** — they may approve, request changes, or ask questions
3. **Iterate** — push new commits to your branch to address feedback
4. **Merge** — once approved and CI passes, a maintainer merges your PR

::: tip
Smaller PRs get reviewed faster. If your change is large, consider splitting it into multiple PRs.
:::

## What Happens After Merge

- Your contribution appears in the [changelog](https://github.com/nexu-io/nexu/releases)
- You're now a Nexu contributor 🎉
- Check out more issues — the [`intermediate`](https://github.com/nexu-io/nexu/labels/intermediate) and [`advanced`](https://github.com/nexu-io/nexu/labels/advanced) labels have bigger challenges

## Using AI Coding Agents?

We welcome PRs generated with AI coding agents (GitHub Copilot, Cursor, Claude Code, etc.). Please:

1. **Add the `agent-assisted` label** to your PR (or the workflow will auto-detect it)
2. **Review the generated code** — you're responsible for the final quality
3. **Verify all checks pass** — `pnpm typecheck && pnpm lint && pnpm test`
4. **Describe your approach** — note which parts were AI-assisted in the PR description

See [Contributing Guide](/guide/contributing) for the full development workflow.

## Need Help?

- Comment on the issue you're working on
- Open a [Discussion](https://github.com/nexu-io/nexu/discussions)
- Join our [Discord](https://discord.gg/nexu)
