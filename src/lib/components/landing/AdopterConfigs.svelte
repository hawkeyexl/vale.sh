<script lang="ts">
	import adopters from '$lib/data/adopters.json';
	import stats from '$lib/data/adopter-stats.json';
	import { sectors } from '$lib/data/sectors';
	import BrandIcon from './BrandIcon.svelte';
	import Section from './Section.svelte';
	import InlineCode from '$lib/components/features/InlineCode.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';

	let { editorial = false }: { editorial?: boolean } = $props();

	type Adopter = {
		name: string;
		category: string;
		context: string;
		url: string;
		github?: string;
		avatar?: string;
		logo?: string;
		icon?: string;
	};

	const all = adopters as Adopter[];

	/*
		A logo wall asserts that a company uses the tool; this band shows where to
		go and check. Each mark's tooltip names the evidence:

		  - a .vale.ini in a public repo  -> the path and the repository
		  - a page the team wrote about   -> the host

		Both are somewhere a reader can open, which is the point.
	*/
	const CONFIG =
		/^https:\/\/github\.com\/([^/]+\/[^/]+)\/blob\/[^/]+\/(.*(?:\.vale\.ini|_vale\.ini|vale\.ini))$/;

	const REPO = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/?$/;

	function receipt(url: string): string {
		const config = CONFIG.exec(url);
		if (config) return `${config[1]} · ${config[2]}`;
		const repo = REPO.exec(url);
		if (repo) return repo[1];
		return new URL(url).hostname.replace(/^www\./, '');
	}

	/*
		The biggest names, gated by proof: each mark has to land on a real
		config or a CI job, since a visitor who clicks and finds a thin page
		stops believing the rest. That gate is why GitLab (a required pipeline
		check) and MetaMask (CI that fails on errors) are here and Discord
		(built-in rules only, no CI) is not. Twelve fills six columns twice.
	*/
	const FEATURED = [
		'Amazon Web Services',
		'Microsoft',
		'NVIDIA',
		'Epic Games',
		'GitHub',
		'Docker',
		'Red Hat',
		'GitLab',
		'Datadog',
		'MongoDB',
		'MetaMask',
		'GOV.UK'
	];

	const byName = new Map(all.map((a) => [a.name, a]));

	const marks = FEATURED.flatMap((name) => {
		const adopter = byName.get(name);
		if (!adopter) return [];
		return [
			{
				...adopter,
				receipt: receipt(adopter.url),
				// BrandIcon resolves a Simple Icons glyph, then the avatar, then a
				// monogram. Most entries name their glyph; fall back to the key the
				// name implies for the ones that don't.
				slug: adopter.icon ?? name.toLowerCase().replace(/[^a-z0-9]/g, '')
			}
		];
	});

	/*
		Three counted figures under the marks, from script/adopters-stats.mjs.
		Each names its denominator, because they differ: every team, the repos
		on GitHub, and the configs that could be opened.
	*/
	const figures = [
		{ value: String(all.length), label: 'teams', gloss: `across ${sectors.length} sectors` },
		{
			value: `${stats.ci} / ${stats.checked}`,
			label: 'run Vale in CI',
			gloss: 'of the repos checked'
		},
		{
			value: `${stats.configs.house} / ${stats.configs.sampled}`,
			label: 'wrote their own rules',
			gloss: 'of the public configs'
		}
	];

	// The nine sectors, each a jump to its band on /adopters.
	const chips = sectors.map((s) => ({
		name: s.name,
		count: all.filter((a) => a.category === s.name).length,
		href: `/adopters#sector-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
	}));

	const total = all.length;
</script>

{#snippet configsLede()}
	Every team here publishes something you can open — the <InlineCode>.vale.ini</InlineCode> they run,
	or the page they wrote about running it. Hover a mark for where.
{/snippet}

<Section
	{editorial}
	eyebrow={editorial ? 'Used in production' : undefined}
	accent={editorial}
	id="configs"
	title="Read their configs"
	lede={configsLede}
>
	<!--
		Twelve bare marks, large, named beneath. The tooltip is the receipt:
		the repository and path, or the host, plus the team's own line. Nothing
		scrolls; these are links and a moving row makes them a moving target.
	-->
	<Tooltip.Provider delayDuration={150}>
		<ul class="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
			{#each marks as mark (mark.name)}
				<li>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<a
									{...props}
									href={mark.url}
									target="_blank"
									rel="noreferrer"
									class="group flex flex-col items-center gap-3 rounded-lg px-2 py-3 text-center transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
								>
									<BrandIcon
										name={mark.name}
										slug={mark.slug}
										avatar={mark.avatar}
										size="h-12 w-12"
									/>
									<span class="text-sm font-medium tracking-tight text-foreground">{mark.name}</span
									>
								</a>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="top" class="max-w-xs text-pretty">
							<span class="block font-mono text-[11px] opacity-80">{mark.receipt}</span>
							<span class="mt-1 block">{mark.context}</span>
						</Tooltip.Content>
					</Tooltip.Root>
				</li>
			{/each}
		</ul>
	</Tooltip.Provider>

	<dl class="mt-12 grid gap-3 sm:grid-cols-3">
		{#each figures as f (f.label)}
			<div class="rounded-xl border border-border bg-card px-5 py-4">
				<dd class="text-2xl font-semibold tracking-tight text-foreground">{f.value}</dd>
				<dt class="mt-0.5 text-sm font-medium text-foreground">{f.label}</dt>
				<p class="mt-0.5 text-xs text-muted-foreground">{f.gloss}</p>
			</div>
		{/each}
	</dl>

	<!-- The split by sector, each chip landing on that sector's roster. -->
	<ul class="mt-6 flex flex-wrap gap-2" aria-label="Adopters by sector">
		{#each chips as chip (chip.name)}
			<li>
				<a
					href={chip.href}
					class="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-lime-500/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
				>
					{chip.name}
					<span class="font-mono text-xs">{chip.count}</span>
				</a>
			</li>
		{/each}
	</ul>

	<div class="mt-8 flex {editorial ? 'justify-start' : 'justify-center'}">
		<a
			href="/adopters"
			class="group inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
		>
			Browse all {total}
			<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
		</a>
	</div>
</Section>
