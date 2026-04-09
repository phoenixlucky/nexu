# Your First Pull Request

This step-by-step guide walks you through submitting your first PR to Nexu — from picking an issue to getting merged. No prior open-source experience required.

## Prerequisites

- A [GitHub](https://github.com) account
- [Git](https://git-scm.com/) installed
- [Node.js](https://nodejs.org/) 24+ (LTS recommended)
- [pnpm](https://pnpm.io/) 10.26+ (`corepack enable && corepack prepare pnpm@latest --activate`)

## Step 1 — Pick an Issue

Browse the [Good First Issues](https://github.com/nexu-io/nexu/labels/good-first-issue) board. Every issue is labeled with three dimensions:

| Label | Meaning |
|-------|---------|
| `area/frontend`, `area/backend`, etc. | Which part of the codebase |
| `difficulty/starter`, `difficulty/easy`, `difficulty/medium` | How long it takes (15 min → 4h) |
| `type/bug`, `type/docs`, `type/style`, etc. | What kind of work |

Each issue includes:
- **Task description** — what needs to be done
- **Expected result** — what it should look like when done
- **Related files** — exactly which files to change
- **Verification steps** — how to confirm your fix works
- **AI Prompt** — copy-paste into Cursor / Claude Code to get started fast
- **Mentor** — who will review your PR (guaranteed response within 48h)

**Claim it** by commenting: `I'd like to work on this`. The mentor will assign it to you.

## Step 2 — Fork and Clone

```bash
# Fork via GitHub UI, then:
git clone https://github.com/YOUR_USERNAME/nexu.git
cd nexu
```

## Step 3 — Set Up Dev Environment

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

```bash
git checkout -b fix/sidebar-alignment
# Naming: fix/..., feat/..., docs/..., chore/...
```

## Step 5 — Code (with AI Assist)

Every Good First Issue includes an **AI Prompt** you can copy into your editor:

1. Open the issue on GitHub
2. Copy the prompt from the "🤖 AI Prompt" section
3. Paste it into Cursor / Claude Code / GitHub Copilot Chat
4. Review and adjust the generated code

::: tip Manual coding works too
The AI prompt is optional — feel free to code entirely by hand.
:::

**While coding:**
- Keep changes focused — one issue per PR
- Follow existing patterns in nearby code
- Run `pnpm lint && pnpm typecheck` frequently
- If you touched API routes/schemas: `pnpm generate-types`
- If you touched docs: `cd docs && pnpm dev` for local preview

## Step 6 — Commit

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "fix: align sidebar collapse button padding"
```

Prefixes: `feat:` | `fix:` | `docs:` | `chore:` | `refactor:`

## Step 7 — Push and Open PR

```bash
git push origin fix/sidebar-alignment
```

Go to your fork on GitHub and click the "Compare & pull request" banner.

### Fill in the PR template

- **What** — one-liner summary
- **Why** — link the issue: `Closes #123`
- **How** — brief approach description
- **Affected areas** — check the relevant `area/*` boxes
- **Mentor** — tag the mentor from the issue

Use the same Conventional Commits format for the PR title.

## Step 8 — Review and Merge

Your assigned mentor will review within **48 hours**:

1. **CI runs automatically** — typecheck, lint, build, ESM verification
2. **Mentor reviews** — may approve, request changes, or ask questions
3. **Iterate** — push new commits to address feedback (re-review within 24h)
4. **Merge** — mentor merges once approved + CI green
5. **Points** — you receive Nexu Points within 1 business day

::: tip
Smaller PRs get reviewed faster. If your change is large, split into multiple PRs.
:::

## After Merge

- You appear in the [changelog](https://github.com/nexu-io/nexu/releases) and Contributors list
- You receive Nexu Points (amount shown on the issue)
- Your mentor will recommend next issues matching your skill level
- Try [`intermediate`](https://github.com/nexu-io/nexu/labels/intermediate) or [`advanced`](https://github.com/nexu-io/nexu/labels/advanced) labels for bigger challenges

## Using AI Coding Agents?

We welcome PRs created with AI tools (Copilot, Cursor, Claude Code, Devin, etc.):

1. **Check the box** in the PR template under "AI / Agent Assistance"
2. **Review the generated code yourself** — you own the quality
3. **Verify all checks pass** — `pnpm typecheck && pnpm lint && pnpm test`
4. Our CI will auto-detect and label agent-assisted PRs for appropriate review

## Need Help?

- **Comment on the issue** — your mentor will respond within 48h
- **Discord [#contributing](https://discord.gg/nexu)** — real-time help from the community
- **[GitHub Discussions](https://github.com/nexu-io/nexu/discussions)** — longer-form questions

See the full [Contributing Guide](/guide/contributing) for detailed workflow documentation.
