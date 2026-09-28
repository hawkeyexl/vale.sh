<script lang="ts">
	import FileText from 'lucide-svelte/icons/file-text';
	import Layers from 'lucide-svelte/icons/layers';
	import Users from 'lucide-svelte/icons/users';

	/*
		The page's opening: eyebrow, title, the lede, and three facts read off
		the list itself. The counts arrive as props so the page stays the one
		place that reads adopters.json.
	*/
	let {
		total,
		sectors,
		configs
	}: {
		total: number;
		sectors: number;
		/** Entries whose link goes straight to a config file. */
		configs: number;
	} = $props();

	const facts = [
		{ icon: Users, term: String(total), gloss: 'teams listed' },
		{ icon: Layers, term: String(sectors), gloss: 'sectors' },
		{ icon: FileText, term: String(configs), gloss: 'public configs' }
	];
</script>

<!-- Matches the Support page's frame. -->
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
