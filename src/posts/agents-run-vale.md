---
title: '28 repositories tell their AI agents to run Vale'
description: 'What AGENTS.md, CLAUDE.md, and Copilot instructions say about Vale at CircleCI, Docker, MongoDB, LangChain, MetaMask, Expo, Pulumi, and twenty more: the model drafts, the linter decides.'
date: '2026-09-28'
draft: true
tags: ['agents', 'adopters']
imageAlt: 'An AGENTS.md file open at the line that says to run Vale before committing.'
---

Twenty-eight of the repositories on the [adopters page](/adopters) keep a file of instructions for AI coding agents, an `AGENTS.md`, a `CLAUDE.md`, a `.cursorrules`, or a `copilot-instructions.md`, and in each of them Vale is named. That count comes from reading the files, not from asking. This post quotes them, because together they describe one working pattern with more precision than any single team's blog post has: the model writes, and a linter that does not read the prose it is judging decides whether it merges.

## The rule, stated plainly

[CircleCI's](https://github.com/circleci/circleci-docs/blob/HEAD/AGENTS.md) is the bluntest. Its list of things an agent must not do includes "Committing without running Vale and fixing linting errors", its list of things it must do begins "Run Vale locally before committing", and the reason is one line: "This is not optional - Vale errors will cause CI failures and block PRs." The file goes further than most, with a note for cloud agents started from Linear or GitHub, which run in isolated machines and "must install Vale locally".

[Expo](https://github.com/expo/expo/blob/HEAD/docs/AGENTS.md) gives the agent the command and the consequence in two lines:

```text
pnpm lint-prose               # Vale prose lint (same rules as CI)
All five must pass. CI fails the PR on any Vale error in added lines.
```

[LangChain](https://github.com/langchain-ai/docs/blob/HEAD/AGENTS.md) says "Always run `make lint_prose` (Vale) before handing off or committing doc changes. CI blocks on it", then lists the common offenders, starting with em dashes surrounded by spaces. [Uniswap](https://github.com/Uniswap/uniswap-ai/blob/HEAD/CLAUDE.md): "Run `bun run docs:lint` to check documentation quality with Vale. This check blocks CI." [Apify](https://github.com/apify/apify-docs/blob/HEAD/AGENTS.md): "The check fails on errors. Run `vale "<file>"` on what you changed rather than working from a summary."

That last clause is the tell. These files were written by people who watched an agent summarize a linter's output instead of reading it.

## Fix the text, not the rule

The second thing the files agree on is what to do when Vale objects. The [CMU Software Engineering Institute](https://github.com/cmu-sei/crucible/blob/HEAD/CLAUDE.md) puts it as policy: "Fix linting errors that you introduce by editing the text, rather than defaulting to editing a linting rule."

The [Docker](https://github.com/docker/docs/blob/HEAD/AGENTS.md) file has a section called "Vale gotchas" that reads like a reviewer's notes to a new hire: use lowercase "config" in prose because the terms rule flags a capital C, and if Vale flags a legitimate product name, the fix is the vocabulary, not the sentence, because a wrong entry "cascades into `Vale.Terms` violations on every correct usage".

The [WSO2](https://github.com/wso2/docs-is/blob/HEAD/.github/copilot-instructions.md) Copilot instructions spell out the judgment call: "If Vale flags a word as a spelling error, check whether it is a legitimate product term, technical term, or widely accepted term. If yes, add it to the accept list. If not, fix the spelling." And a fallback for when the agent has no Vale at all: "If Vale output is not available, remind the user to run Vale locally."

The [MongoDB](https://github.com/mongodb/docs/blob/HEAD/CLAUDE.md) file closes the loop on what the agent may not decide alone: Vale findings that cannot be resolved are surfaced to the user before the work is handed back.

## Vale as the mechanical half

Several files draw the same line between what the linter checks and what it cannot. [Infisical](https://github.com/Infisical/infisical/blob/HEAD/AGENTS.md) says its `make lint-docs` target "runs Vale over the docs and enforces the mechanical half of the style guide", naming sentence case in headings and titles and the product and feature names, and points the agent at a separate skill for the rest. The [Coder](https://github.com/coder/coder/blob/HEAD/docs/AGENTS.md) docs file: "Vale enforces a subset of these rules and reports the rest as advisory annotations." [Prefect](https://github.com/prefecthq/prefect/blob/HEAD/docs/AGENTS.md) and [Temporal](https://github.com/temporalio/documentation/blob/HEAD/AGENTS.md) both tell the agent that preferred terms are enforced by Vale and name the substitution file, so the agent can read the list rather than guess at it.

The [Pulumi](https://github.com/pulumi/docs/blob/HEAD/AGENTS.md) file is the most worked-out. Vale there "nags, never blocks", its findings also surface in pull request reviews, and the file describes a fix mode separate from a review mode, with one caution any team automating fixes will meet: "A Vale fix can create a Vale finding: the rules are independent, so a phrase one rule pushes you toward can be a phrase another rule flags."

## The version, pinned once

Two files care about which Vale runs. LangChain pins the version in one place and has the make targets, the install script, and the CI workflow all read it from there, "so local runs use the same engine as CI". Temporal states the floor, Vale 3.20 or later, because its `Std` style needs nested rule directories, and gives the command that runs "CI-scoped rules only (what PR checks run)" separately from the full set.

## The rest of the list

The other files are shorter, and say the same thing in fewer words: run Vale before you hand back. [Ansys](https://github.com/ansys/pymapdl/blob/HEAD/AGENTS.md) wants edits made "so `codespell` and `vale` pass". [Buildkite](https://github.com/buildkite/docs/blob/HEAD/AGENTS.md) names the script and where exceptions go. [DocsGPT](https://github.com/arc53/DocsGPT/blob/HEAD/AGENTS.md), [DuckDB](https://github.com/duckdb/duckdb-web/blob/HEAD/CLAUDE.md), [Homebrew](https://github.com/Homebrew/brew/blob/HEAD/docs/AGENTS.md), [Infrahub](https://github.com/opsmill/infrahub/blob/HEAD/docs/AGENTS.md), [Kong](https://github.com/Kong/developer.konghq.com/blob/HEAD/CLAUDE.md), [MUI](https://github.com/mui/material-ui/blob/HEAD/AGENTS.md), and [OutSystems](https://github.com/OutSystems/docs-product/blob/HEAD/CLAUDE.md) give the one command. [Innovations for Poverty Action](https://github.com/PovertyAction/ipa-research-data-science-hub/blob/HEAD/CLAUDE.md) says "Always run `just vale-file <file>` on any content you create or modify". [Tigera](https://github.com/tigera/docs/blob/HEAD/.github/copilot-instructions.md), [Yii](https://github.com/yiisoft/docs/blob/HEAD/.github/copilot-instructions.md), [dbt Labs](https://github.com/dbt-labs/docs.getdbt.com/blob/HEAD/AGENTS.md), [Telepresence](https://github.com/telepresenceio/telepresence/blob/HEAD/AGENTS.md), [MetaMask](https://github.com/MetaMask/metamask-docs/blob/HEAD/AGENTS.md), and [Write the Docs](https://github.com/writethedocs/www/blob/HEAD/AGENTS.md) point at the config and the workflow that runs it.

## What this is

None of these teams wrote a post about it. They wrote a line in a file that a model reads before it touches their docs, and the line says the same thing in twenty-eight ways: the draft is yours, the verdict is Vale's. It is the division of labor [PostHog described](https://posthog.com/handbook/wizard-and-docs/vale) in a sentence, Vale to detect the issues and the language model to help fix them, arrived at independently, in the one place an agent cannot skip.

Every file is linked above. If your repository has one, the [adopters page](/adopters) can filter for it: pick "AI agents" under how it's used.
