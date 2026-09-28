---
title: 'Chip specs, ancient Greek, and the names in the proofs'
description: 'Five Vale setups from outside the docs team, read rule by rule: a chip standard, a language model for Greek philology, a theorem prover, an embedded SDK, and a Kubernetes project with five vocabularies.'
date: '2026-09-27'
tags: ['adopters']
imageAlt: 'A terminal listing Vale styles by name, from RISC-V to Logion.'
draft: true
---

Most Vale config files check product documentation, and most of the teams on the [adopters page](/adopters) are docs teams. This post is about the others: public config files that lint a chip specification, a proof assistant's manual, a tool for restoring damaged Greek texts. Each section reads one setup rule by rule, because the rules are where these teams say what they actually needed.

## RISC-V: the specification itself

RISC-V is the open instruction-set architecture in chips from the smallest embedded boards to data centers, and its specifications are written in AsciiDoc. The [riscv-vale](https://github.com/riscv-admin/riscv-vale) repository puts it plainly: "RISC-V International uses Vale to implement the rules defined by the Doc-Sig and approved by the TSC." Seventeen rules, published as a package, following the guidance in the [Authoring and Editing RISC-V Specifications](https://github.com/riscv/docs-dev-guide) guide.

What makes it work across dozens of specification repositories is the shape of the setup, not the rule count. Every specification repository gets the same two files: a `.vale.ini` that syncs the package, and a workflow of ten lines that calls one reusable workflow kept in the rules repository.

```yaml
name: Linting with Vale using Reusable Config

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  call-reusable-vale:
    uses: ./.github/workflows/vale-reusable.yml
```

The reusable side installs Asciidoctor, runs the official Action on the pull request's changed lines only, at the error level, and fails the check on an error. Change a rule once and every specification picks it up on its next pull request.

```yaml
- uses: vale-cli/vale-action@2.1.2
  with:
    filter_mode: diff_context
    vale_flags: '--no-exit --minAlertLevel=error --glob=*.adoc'
    reporter: github-check
    fail_on_error: true
```

The rules are about the architecture as much as the prose. A control and status register is a `CSR`, never a `csr`, so one rule exists to say so at the error level. Another replaces older terms with a list of alternatives, and its patterns show the care a hardware standard needs: `master(?! broker)`, because a "master broker" is a real thing with no replacement.

```yaml
extends: substitution
ignorecase: true
level: warning
message: "Use %s rather than '%s'."
action:
  name: replace
swap:
  blacklist: blocklist
  master(?! broker): primary|source|initiator|requester|controller|host|director|supplier
  slave(?! broker): secondary|replica|responder|device|worker|proxy|performer|consumer|child
  whitelist: allowlist
```

A third is a grammar rule with a fix attached. "The register using the mask" becomes "the register by using the mask", and the `edit` action means an editor can apply it in place.

```yaml
extends: sequence
message: "Use 'by using' instead of 'using' when it follows a noun for clarity and grammatical correctness."
level: warning
action:
  name: edit
  params:
    - regex
    - '(\w+)( using)'
    - '$1 by using'
```

Sources: [the reusable workflow](https://github.com/riscv-admin/riscv-vale/blob/HEAD/.github/workflows/vale-reusable.yml), [CapitalizeCSR.yml](https://github.com/riscv-admin/riscv-vale/blob/HEAD/styles/riscv/CapitalizeCSR.yml), [FriendlyTerms.yml](https://github.com/riscv-admin/riscv-vale/blob/HEAD/styles/riscv/FriendlyTerms.yml), [Using.yml](https://github.com/riscv-admin/riscv-vale/blob/HEAD/styles/riscv/Using.yml).

## Princeton: a language model for ancient Greek

[Logion](https://github.com/princeton-logion/logion-app) is Princeton's machine-learning tool for Greek philology: it helps scholars find scribal errors and restore damaged text. Its docs run a `logionDoc` style of ten rules, and reading them in order shows a house style being built for a house that works in two alphabets.

Start with the headings. Sentence-style casing, with exceptions for the field's proper nouns and, on the last line, for any word written in Greek letters.

```yaml
extends: capitalization
message: "Use sentence-style casing in header '%s'."
level: error
scope: heading
match: $sentence
exceptions:
  - CPU
  - GPU
  - Logion
  - Levenshtein
  - Greek
  - Latin
  - Classics
  - '[Α-Ωα-ω]+'
```

Spelling is its own rule rather than the built-in one, with `vocab: false` and a plain text file of exceptions beside it. The file is short and specific to the work: `Levenshtein`, `mistranscribed`, `mistranscribe`, `explainers`.

```yaml
extends: spelling
message: "Check spelling for '%s'."
vocab: false
level: error
ignore:
  - logionDoc/spell-exceptions.txt
```

Then the word list, which is where a small team's taste lives. Some entries are the usual ones, `e-mail` to `email`, `url` to `URL`. Two are the project's own calls: `application` becomes `app`, and `machine` becomes `device`, which matters when half the readers will run the tool on a laptop and the other half on a cluster.

```yaml
extends: substitution
message: "Use '%s' instead of '%s'."
level: error
ignorecase: false
action:
  name: replace
swap:
  '(?:e-mail|Email|E-mail)': email
  '(?:artificial intelligence|ai)': AI
  application: app
  CLI: command-line tool
  url: URL
  machine: device
```

The last rule is about accessibility, and it is the kind of thing a team adds after a reviewer says it once. Link text that reads "here" or "this page" is an error.

```yaml
extends: existence
message: "Improve link text accessibility for '%s'."
level: error
scope: raw
tokens:
  - '\[here\]'
  - '\[this page\]'
  - '\[this link\]'
```

Sources: [Headings.yml](https://github.com/princeton-logion/logion-app/blob/HEAD/.vale/style/logionDoc/Headings.yml), [Spelling.yml](https://github.com/princeton-logion/logion-app/blob/HEAD/.vale/style/logionDoc/Spelling.yml), [WordList.yml](https://github.com/princeton-logion/logion-app/blob/HEAD/.vale/style/logionDoc/WordList.yml), [LinkWords.yml](https://github.com/princeton-logion/logion-app/blob/HEAD/.vale/style/logionDoc/LinkWords.yml).

## Lean: the names in the proofs

Lean is the proof assistant mathematicians use to formally verify results, and its [reference manual](https://github.com/leanprover/reference-manual) runs a `Lean` style of eight rules beside the `proselint` package. Three of them could only come from this project.

The first gets the people right. A substitution table, at the error level, so `de bruijn` becomes `de Bruijn` and `grober` gets its umlaut back.

```yaml
extends: substitution
message: Use '%s' instead of '%s'.
level: error
ignorecase: true
swap:
  - 'de moura': 'de Moura'
  - 'de bruijn': 'de Bruijn'
  - 'carneiro': 'Carneiro'
  - 'peano': 'Peano'
  - 'wadler': 'Wadler'
  - 'grober': 'Gröbner'
```

The second keeps Latin terms whole. Logic texts are full of `modus ponens` and `per se`, and the rule's patterns catch the case where a writer has split one, or hyphenated half of it, by matching anything that sits where the other word should be.

```yaml
extends: substitution
message: This Latin term should be used as a single unit. Use '%s' instead of '%s'.
level: error
ignorecase: true
swap:
  - '(?:[^\s]*) se\b': 'per se'
  - '(?:[^\s]*) ponens\b': 'modus ponens'
  - 'modus (?:[^\s]*)\b': 'modus ponens'
```

The third is the technical vocabulary of the language itself, and it reads like a list of arguments the maintainers have already had: `typeclass` is two words, `iff` is spelled out, `abelian` takes a capital, and `enum` on its own is always `enum inductive`.

```yaml
extends: substitution
message: Use '%s' instead of '%s'
level: error
ignorecase: true
capitalize: true
swap:
  'typeclass': 'type class'
  'codepoint': 'code point'
  'iff': 'if and only if'
  'nonterminating': 'non-terminating'
  'enum \b\w+\b': 'enum inductive'
  '\babelian\b': 'Abelian'
  'context free grammar': 'context-free grammar'
```

The config around them is worth a look too. The manual is generated HTML with docstrings pulled in from the source, so the `.vale.ini` skips those by class rather than by tag, with a comment explaining that the tree under a code element was not being skipped as a whole.

```ini
IgnoredScopes = code, tt
SkippedScopes = script, style, pre, div
IgnoredClasses = namedocs, hl, token, goal-name, citation, TODO
```

Sources: [Names.yml](https://github.com/leanprover/reference-manual/blob/HEAD/.vale/styles/Lean/Names.yml), [Latin.yml](https://github.com/leanprover/reference-manual/blob/HEAD/.vale/styles/Lean/Latin.yml), [TechnicalTerms.yml](https://github.com/leanprover/reference-manual/blob/HEAD/.vale/styles/Lean/TechnicalTerms.yml), [.vale.ini](https://github.com/leanprover/reference-manual/blob/HEAD/.vale.ini).

## Nordic Semiconductor: the SDK for the chips in your headphones

The [nRF Connect SDK](https://github.com/nrfconnect/sdk-nrf) is the software for Nordic's Bluetooth and cellular chips. Its docs are reStructuredText, and they fail on errors from a `Nordic` style of thirty-six rules: gender bias, passive voice, sentence length, date order, units, hyphens, and the rest of a full house style. Two things about the setup stand out before any rule does.

First, the style is a package. Its `meta.json` points at a release feed, so the SDK repository carries a copy of a style that is versioned and published on its own. Second, the config knows its format. It tells Vale what a literal block and an inline literal are in reStructuredText, and it ignores the roles and double-backtick spans that would otherwise read as prose.

```ini
MinAlertLevel  = error
IgnoredScopes  = source.rst.literal_block,source.rst.inline_literal,source.rst.comment,markup.raw.block,markup.raw.inline,comment

[*.rst]
BasedOnStyles  = Nordic
BlockIgnores  = (?sm)^\s*\.\.\s+code-block::.*\n(?:[ \t]+.*\n)+
TokenIgnores   = (?ms):[A-Za-z0-9_+-]+:`[^`]*`,(?ms)``[^`]*``
```

The word rules come in three strengths, and the split is the interesting part. `Avoid.yml` is a flat ban at the error level. `Vocab.yml` is a suggestion that says only "verify your use of this with the A-Z word list", for words that are fine in one sense and not another. `Terms.yml` sits between them as a warning with a replacement attached, and its comments say what a hardware vendor's list has to handle that a general style guide never will.

```yaml
extends: substitution
message: "Prefer '%s' over '%s'."
level: warning
ignorecase: true
swap:
  # kB not kb, not in a link
  "(?<![\\w/\\.-])kb(?![\\w\\.-])": kB
  # J-Link not jlink, not in a command syntax
  "\b[Jj]link\b": J-Link
  adaptor: adapter
```

Four more rule files sit in the same directory with an `_ignored` suffix on the name. Vale reads only `.yml`, so a rule can be switched off by renaming it, and switched back on the same way, with the file and its history intact.

Sources: [.vale.ini](https://github.com/nrfconnect/sdk-nrf/blob/HEAD/.vale.ini), [the Nordic style](https://github.com/nrfconnect/sdk-nrf/tree/HEAD/scripts/vale/styles/Nordic), [Terms.yml](https://github.com/nrfconnect/sdk-nrf/blob/HEAD/scripts/vale/styles/Nordic/Terms.yml).

## Calico: five vocabularies and a rule about grammar

[Calico](https://github.com/tigera/docs) is a Kubernetes networking and security project, and its docs are MDX. The config keeps not one vocabulary but five, split by what the words are: `CalicoAcronyms`, `CalicoBrands`, `CalicoDocs`, `CalicoTerminology`, and `CalicoTools`. The terminology file is patterns, so `anonymize`, `anonymized`, and `anonymization` are one line, and the brands file opens like this, with a pattern on the last line that accepts a plural:

```text
Alertmanager
Atlassian
Bottlerocket
BusyBox
CloudWatch
ConfigMaps?
```

Splitting the list is the point. A reviewer can see which kind of word a term is, and a new one goes in the file that says so.

```ini
Vocab = CalicoDocs, CalicoBrands, CalicoTerminology, CalicoTools, CalicoAcronyms

[*.{md,mdx}]
BasedOnStyles = Vale, CalicoStyle
Vale.Terms = warning
```

That last line comes with the longest comment in the file, and it is the most useful thing in it. The built-in terms check flags lowercase technical names in table cells and parenthetical lists, and the usual fix, a token-ignore pattern, cannot be used here because it runs before the MDX parser and a broad pattern corrupts the tree when it matches inside a fenced block. So the check runs at warning level instead, and the house substitution rule limits itself to prose with `scope: text`, which keeps it away from metric names and config keys.

```yaml
extends: substitution
message: "Use '%s' instead of '%s'."
level: error
ignorecase: true
scope: text
swap:
  'dataplane': 'data plane'
  'dataplanes': 'data planes'
  'quick start': 'quickstart'
```

The other rule in the style is about grammar, and it is the one to copy. "This guide walks through the steps" has lost its object. The rule catches the guiding sense, where a page or a set of steps is doing the walking, and leaves the collective sense alone, because "we'll walk through these steps together" is fine.

```yaml
extends: existence
message: "'%s' is missing an indirect object. Add one (e.g., 'walks you through') or rewrite with 'covers', 'describes', or 'explains'."
level: error
ignorecase: true
scope: text
tokens:
  - '\bwalks\s+through\b'
  - '\b(?:steps|procedures|sections|tutorials|chapters|exercises|labs|articles)\s+walk\s+through\b'
```

Sources: [.vale.ini](https://github.com/tigera/docs/blob/HEAD/.vale.ini), [Substitutions.yml](https://github.com/tigera/docs/blob/HEAD/.github/styles/CalicoStyle/Substitutions.yml), [Walkthrough.yml](https://github.com/tigera/docs/blob/HEAD/.github/styles/CalicoStyle/Walkthrough.yml).

## What they have in common

None of these teams has a documentation department. Each has a body of writing that has to be right about its own vocabulary, whether that is a register name, a mathematician's surname, or a Greek word in a heading, and each wrote the rule once instead of reviewing for it forever. Every file above is public, so the rule is the proof.

All of them are on the [adopters page](/adopters), where the directory can be filtered by sector and by how each team runs Vale. If yours belongs there, [adding it is one JSON entry](https://github.com/errata-ai/vale.sh#add-your-team-to-the-home-page).
