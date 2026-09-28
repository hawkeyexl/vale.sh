<script lang="ts">
	import { MetaTags } from 'svelte-meta-tags';
	import adopters from '$lib/data/adopters.json';
	import stats from '$lib/data/adopter-stats.json';
	import { sectors } from '$lib/data/sectors';
	import AdopterExplorer from '$lib/components/landing/AdopterExplorer.svelte';
	import BrandIcon from '$lib/components/landing/BrandIcon.svelte';
	import Section from '$lib/components/landing/Section.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';
	import FileText from 'lucide-svelte/icons/file-text';
	import Layers from 'lucide-svelte/icons/layers';
	import Users from 'lucide-svelte/icons/users';

	type Adopter = {
		name: string;
		category: string;
		context: string;
		url: string;
		icon?: string;
		avatar?: string;
	};

	const all = adopters as Adopter[];
	const byName = new Map(all.map((a) => [a.name, a]));
	const total = all.length;

	// A link straight at a config file, as opposed to a repo or a write-up.
	const configs = all.filter((a) =>
		/^https:\/\/github\.com\/.+\/blob\/.+vale\.ini$/.test(a.url)
	).length;

	const countFor = (sector: string) => all.filter((a) => a.category === sector).length;

	// One band per sector, with its whole roster in alphabetical order and
	// the sector's own counts from script/adopters-stats.mjs.
	const bands = sectors.map((s) => ({
		...s,
		id: `sector-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
		count: countFor(s.name),
		members: all.filter((a) => a.category === s.name).sort((a, b) => a.name.localeCompare(b.name)),
		ci: stats.bySector[s.name as keyof typeof stats.bySector]
	}));

	const facts = [
		{ icon: Users, term: String(total), gloss: 'teams listed' },
		{ icon: Layers, term: String(sectors.length), gloss: 'sectors' },
		{ icon: FileText, term: String(configs), gloss: 'public configs' }
	];

	/*
		What the repos do, counted by script/adopters-stats.mjs rather than
		claimed: CI configs read for the word "vale", configs read for the
		styles they base on. Each figure names its denominator, because the
		three are different -- repos on GitHub, configs that could be opened,
		and all the repos checked.
	*/
	const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 0 });
	const kpis = [
		{
			value: stats.ci,
			of: stats.checked,
			label: 'run Vale in CI',
			gloss: `of ${stats.checked} repos checked: a GitHub workflow, GitLab CI, CircleCI, or Buildkite config that calls Vale`
		},
		{
			value: stats.configs.house,
			of: stats.configs.sampled,
			label: 'wrote their own rules',
			gloss: `of ${stats.configs.sampled} public configs: based on a style that is not a registry package`
		},
		{
			value: stats.actionDependents ?? 0,
			label: 'repos using the Vale Action',
			gloss: `GitHub's dependents count for vale-cli/vale-action, as of ${stats.generated}, most of them not on this list`
		},
		{
			value: stats.stars,
			label: 'GitHub stars, combined',
			gloss: `across the ${stats.checked} repos checked, as of ${stats.generated}`
		}
	];

	// Owned here so the sector bands and the directory's chips move together.
	let category = $state('All');

	const description = `${total} teams across ${sectors.length} sectors run Vale, each entry linking to a public .vale.ini, style package, or write-up.`;
</script>

<MetaTags
	title="Adopters"
	{description}
	canonical="https://vale.sh/adopters"
	openGraph={{
		url: 'https://vale.sh/adopters',
		title: 'Teams running Vale',
		description,
		images: [
			{
				url: '/media/mac.png',
				width: 800,
				height: 600,
				alt: 'Example Vale output'
			}
		]
	}}
/>

<!-- Declared outside the provider: a snippet inside a component's children
	 would be read as one of its props. -->
{#snippet sectorsLede()}
	Every team, grouped by the sector it works in, with what its repos do counted rather than claimed.
{/snippet}

<!--
	One tooltip provider for the page: the header cards and every roster mark
	open the same way, after the same short delay, and only one is open at a
	time.
-->
<Tooltip.Provider delayDuration={150}>
	<!-- Header, matching the Support page's frame. -->
	<section class="relative overflow-hidden border-b border-border/60">
		<div
			class="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_60%,transparent_100%)]"
		></div>
		<div class="mx-auto max-w-4xl px-6 py-16 text-center lg:px-8">
			<p class="text-base font-semibold text-lime-600 dark:text-lime-400">Adopters</p>
			<h1 class="mt-2 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
				One linter, every sector
			</h1>
			<p class="mx-auto mt-4 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
				Hyperscalers and observatories, chip makers and government services, AI labs and Linux
				distributions. Every entry links to something you can open: the <code
					class="rounded bg-muted px-1.5 py-0.5 text-base">.vale.ini</code
				> a team runs, the style package it publishes, or the page it wrote about running it.
			</p>

			<dl class="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-3">
				{#each facts as fact (fact.gloss)}
					{@const Icon = fact.icon}
					<div class="rounded-xl border border-border bg-card px-3 py-4">
						<dt class="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
							<Icon class="h-3.5 w-3.5" />
							{fact.gloss}
						</dt>
						<dd class="mt-1 text-2xl font-semibold tracking-tight">{fact.term}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>

	<Section id="sectors" eyebrow="Sectors" title="Where the writing gets checked" lede={sectorsLede}>
		<!--
		Four figures before the bands. A stat tile each: value, label, and the
		line that says how it was counted. Two are ratios, so each carries a
		meter against its own denominator; the Action's dependents and the star
		total stand alone.
	-->
		<dl class="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each kpis as kpi (kpi.label)}
				<div class="rounded-xl border border-border bg-card p-5">
					<dd class="text-3xl font-semibold tracking-tight text-foreground">
						{kpi.of ? kpi.value : compact.format(kpi.value)}{#if kpi.of}<span
								class="text-base font-normal text-muted-foreground"
							>
								/ {kpi.of}</span
							>{/if}
					</dd>
					<dt class="mt-1 text-sm font-medium text-foreground">{kpi.label}</dt>
					{#if kpi.of}
						<div
							class="mt-3 h-1.5 overflow-hidden rounded-r bg-muted"
							role="meter"
							aria-valuemin="0"
							aria-valuemax={kpi.of}
							aria-valuenow={kpi.value}
							aria-label={kpi.label}
						>
							<div
								class="h-full rounded-r bg-lime-600"
								style="width: {(kpi.value / kpi.of) * 100}%"
							></div>
						</div>
					{/if}
					<p class="mt-3 text-xs leading-5 text-muted-foreground">{kpi.gloss}</p>
				</div>
			{/each}
		</dl>

		<!--
		One band per sector: what it is on the left, everyone in it on the
		right, alphabetically. Marks stay in color -- a roster is meant to be
		recognized -- and each is the team's own proof. "Browse" hands the sector to the directory
		below, where the cards carry the one-line context the marks cannot.
	-->
		<ol class="space-y-4">
			{#each bands as band (band.name)}
				{@const Icon = band.icon}
				<li
					id={band.id}
					class="grid scroll-mt-28 gap-6 rounded-xl border border-border bg-card p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
				>
					<div class="flex flex-col">
						<div class="flex items-center gap-2.5">
							<span
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-lime-600 ring-1 ring-border dark:text-lime-400"
							>
								<Icon class="h-4 w-4" />
							</span>
							<h3 class="text-lg font-semibold tracking-tight text-foreground">{band.name}</h3>
							<span class="font-mono text-xs text-muted-foreground">{band.count}</span>
						</div>
						<p class="mt-3 text-sm leading-6 text-muted-foreground">{band.blurb}</p>
						{#if band.ci?.checked}
							<p class="mt-3 grow font-mono text-xs text-muted-foreground">
								{band.ci.ci} of {band.ci.checked} repos run it in CI
								{#if band.ci.house}· {band.ci.house} with house rules{/if}
							</p>
						{:else}
							<span class="grow"></span>
						{/if}
						<a
							href="#adopters"
							onclick={() => (category = band.name)}
							class="group mt-4 inline-flex items-center gap-1 self-start text-sm font-medium text-lime-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500 dark:text-lime-400"
						>
							Browse {band.count} in the directory
							<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
						</a>
					</div>

					<!--
					Bare marks, no tiles: the logo is the unit. Each link pads out to a
					44px target around a 36px mark, lifts on hover, and names itself in
					a tooltip.
				-->
					<ul class="flex flex-wrap content-start gap-1" aria-label="{band.name} teams">
						{#each band.members as team (team.name)}
							<li>
								<!--
								The tooltip carries the name the bare mark cannot, plus the
								team's one line. The trigger renders as the link itself, so a
								hover or a focus opens it and a click still goes to the proof.
							-->
								<Tooltip.Root>
									<Tooltip.Trigger>
										{#snippet child({ props })}
											<a
												{...props}
												href={team.url}
												target="_blank"
												rel="noreferrer"
												class="flex h-11 w-11 items-center justify-center rounded-md transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
											>
												<BrandIcon
													name={team.name}
													slug={team.icon}
													avatar={team.avatar}
													size="h-9 w-9"
												/>
												<span class="sr-only">{team.name}</span>
											</a>
										{/snippet}
									</Tooltip.Trigger>
									<Tooltip.Content side="top" class="max-w-xs text-pretty">
										<span class="font-semibold">{team.name}</span>
										<span class="opacity-80"> · {team.context}</span>
									</Tooltip.Content>
								</Tooltip.Root>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ol>
	</Section>

	<AdopterExplorer bind:activeCategory={category} />

	<Section
		id="add"
		eyebrow="Contribute"
		title="Add your team"
		lede="If your team runs Vale and can point at a public config, style package, or write-up, it belongs here. Entries are one JSON object; the avatar is fetched for you."
	>
		<div class="flex justify-center">
			<a
				href="https://github.com/errata-ai/vale.sh#add-your-team-to-the-home-page"
				target="_blank"
				rel="noreferrer"
				class="group inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
			>
				How to add an entry
				<ArrowUpRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
			</a>
		</div>
	</Section>
</Tooltip.Provider>
