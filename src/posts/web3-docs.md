---
title: 'Nothing merges into the MetaMask docs without passing Vale'
description: 'The wallet, the L2, the DEX, and five more: what eight Web3 teams put in their Vale config files, and how MetaMask wires it into CI so a style error blocks the merge.'
date: '2026-09-28'
draft: true
tags: ['adopters']
imageAlt: 'A pull request check list with two Vale spelling checks marked required.'
---

Eight teams on the [adopters page](/adopters) file under Web3. Between them they cover a wallet, a layer-two chain, a decentralized exchange, a multisig, a node provider, a peer-to-peer file system, a wiki for a chain, and the shared docs template behind a good part of that list. This post reads their setups, because a config file says more about how a team works than a logo does.

## MetaMask: the required check

The [MetaMask docs](https://github.com/MetaMask/metamask-docs) run Vale in a job named `spelling`, and the job is a required check. The comment at the top of it says what it does and what it does not do: Vale runs on every changed `.md` and `.mdx` file, fails on real Vale errors, and runs the binary directly rather than through the Reviewdog-based Action. The two required checks are named "Spelling (.md)" and "Spelling (.mdx)", one per format.

The steps are the shape any team can copy. Check out the shared config, install a pinned Vale release, and run it on the diff.

```yaml
- name: Checkout Vale config
- name: Install Vale
  env:
    VALE_VERSION: '3.15.1'
```

Two details are the whole design. Pinning the version means a Vale release never changes what merges on a Tuesday. And running on changed files only means a thousand pages of history are not re-litigated on every pull request; the gate is on what the author touched.

Source: [ci.yml](https://github.com/MetaMask/metamask-docs/blob/HEAD/.github/workflows/ci.yml), [vale-staged.sh](https://github.com/MetaMask/metamask-docs/blob/HEAD/scripts/vale-staged.sh).

## Consensys: one config, every doc site

The rules MetaMask runs are not MetaMask's. They come from Consensys, whose [docs template](https://docs-template.consensys.io/contribute/run-vale) carries one Vale configuration for every documentation site the company publishes. The template's own page says Vale "is executed on each pull request (PR) using a GitHub action", and the checkout step in MetaMask's workflow is the seam where that shared config arrives.

That is the pattern for any organization with more than one docs repository: keep the rules in one place, have each site fetch them in CI, and the vocabulary stays the same across products without a copy of it in each repository drifting.

## Optimism: the docs inside the monorepo

The [Optimism monorepo](https://github.com/ethereum-optimism/optimism) keeps its public docs at `docs/public-docs`, and the config sits beside them. It runs Vale's built-in rules and an `Optimism` vocabulary, so the names of the chain's own components are never spelling errors and are always cased the same way.

```ini
StylesPath = .vale/styles
MinAlertLevel = suggestion
Vocab = Optimism

[*.{md,mdx}]
BasedOnStyles = Vale
```

Source: [.vale.ini](https://github.com/ethereum-optimism/optimism/blob/HEAD/docs/public-docs/.vale.ini).

## Alchemy: a style for one product

Alchemy's [account-abstraction SDK](https://github.com/alchemyplatform/aa-sdk) does something the larger docs sites rarely do: it writes a style for one product. The config bases the SDK docs, written in MDX, on Vale's rules plus a `SmartWallets` style with its own vocabulary, so the terms of one feature area get their own rules rather than a line in a company-wide list.

```ini
StylesPath = .vale/styles
Vocab = SmartWallets
MinAlertLevel = suggestion

[*.{md,mdx}]
BasedOnStyles = Vale, SmartWallets
```

Source: [.vale.ini](https://github.com/alchemyplatform/aa-sdk/blob/HEAD/.vale.ini).

## Uniswap: the docs for the agents

The [Uniswap AI repository](https://github.com/Uniswap/uniswap-ai) holds Uniswap's AI tools, skills, and agents, and its docs are linted with a `Uniswap` vocabulary under Vale's rules. It is the one entry on this list whose readers are as likely to be a model as a person: the skills are written to be loaded by an agent, and the prose they carry is checked the same way a page for humans is.

```ini
StylesPath = .github/vale/styles
MinAlertLevel = suggestion
Vocab = Uniswap
```

Source: [.vale.ini](https://github.com/Uniswap/uniswap-ai/blob/HEAD/.vale.ini).

## Polkadot, Safe, IPFS: three ways to start

The remaining three show the three ways a team usually begins.

**Polkadot** starts from a published guide. The [Polkadot Wiki](https://github.com/w3f/polkadot-wiki) runs Google's developer documentation style and adds a `Polkadot` style on top, with two vocabularies: `Industry` for the words the whole field shares and `Polkadot` for its own.

```ini
StylesPath = .github/styles
MinAlertLevel = suggestion
Vocab = Industry, Polkadot
Packages = Google

[*.md]
BasedOnStyles = Vale, Google, Polkadot
```

**Safe** starts from two packages and no house style at all. The [Safe docs](https://github.com/safe-global/safe-docs) run Microsoft's style and `write-good` together, which is the most common pairing on the whole adopters list, and keep a vocabulary for the names.

```ini
StylesPath = .github/styles
MinAlertLevel = suggestion
Vocab = default
Packages = Microsoft, write-good

[*.{md,mdx}]
BasedOnStyles = Vale, Microsoft, write-good
```

**IPFS** starts small and local. The [IPFS docs](https://github.com/ipfs/ipfs-docs) keep a `docs` style in the repository, with code spans ignored so that a CID or a multiaddr in backticks is never read as a word.

Sources: [Polkadot Wiki .vale.ini](https://github.com/w3f/polkadot-wiki/blob/HEAD/.vale.ini), [Safe docs .vale.ini](https://github.com/safe-global/safe-docs/blob/HEAD/.vale.ini), [IPFS docs .vale.ini](https://github.com/ipfs/ipfs-docs/blob/HEAD/.vale.ini).

## What the eight have in common

Five of the seven with a GitHub repository run Vale in CI, and every one of the eight keeps a vocabulary of its own names. That is the whole of it. A chain's docs are full of words no dictionary knows and no general style guide has an opinion on, and the first thing each of these teams did was write those words down once.

The files are all public, so the setup is the proof. If your team runs Vale and belongs on the list, [adding it is one JSON entry](https://github.com/errata-ai/vale.sh#add-your-team-to-the-home-page).
