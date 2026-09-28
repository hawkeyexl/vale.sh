<script lang="ts">
	import FileText from 'lucide-svelte/icons/file-text';
	import Layers from 'lucide-svelte/icons/layers';
	import Users from 'lucide-svelte/icons/users';
	import ArrowRight from 'lucide-svelte/icons/arrow-right';
	import * as Carousel from '$lib/components/ui/carousel';

	type HeroPost = {
		slug: string;
		title: string;
		description: string;
		date: string;
		tags: string[];
		image: string | null;
		imageAlt: string;
		draft: boolean;
	};

	/*
		The page's opening: eyebrow, title, the lede, and three facts read off
		the list itself. The counts arrive as props so the page stays the one
		place that reads adopters.json.
	*/
	let {
		total,
		sectors,
		configs,
		posts = []
	}: {
		total: number;
		sectors: number;
		/** Entries whose link goes straight to a config file. */
		configs: number;
		/** Published case studies and adopter posts, from the route's load. */
		posts?: HeroPost[];
	} = $props();

	const dateOf = (iso: string) =>
		new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});

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

	{#if posts.length}
		<!--
			The case studies, one card each, sliding. The hero is where a visitor
			decides whether the list is worth reading, and a post that reads one
			team's setup end to end is the strongest answer. Only published posts
			reach here, so the row grows as the series does.
		-->
		<div class="mx-auto max-w-5xl px-6 pb-16 lg:px-8">
			<div class="mb-4 flex items-baseline justify-between">
				<p class="font-mono text-[11px] uppercase tracking-[0.13em] text-muted-foreground">
					Case studies
				</p>
				<a
					href="/blog/tags/case-studies"
					class="inline-flex items-center gap-1 text-sm font-medium text-lime-600 hover:underline dark:text-lime-400"
				>
					All posts
					<ArrowRight class="h-4 w-4" />
				</a>
			</div>
			<Carousel.Root opts={{ align: 'start' }} class="relative">
				<Carousel.Content class="-ml-4">
					{#each posts as post (post.slug)}
						<Carousel.Item class="pl-4 md:basis-1/2 lg:basis-1/3">
							<a
								href="/blog/{post.slug}"
								class="group flex h-full flex-col rounded-xl border border-border bg-card p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-lime-500/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
							>
								{#if post.image}
									<!--
										The post's branded card, cropped to a wide band. Its subject
										sits at the center of the image, so the crop keeps it.
									-->
									<img
										src={post.image}
										alt={post.imageAlt}
										loading="lazy"
										class="mb-4 aspect-[2/1] w-full rounded-lg border border-border object-cover"
									/>
								{/if}
								<span class="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
									{dateOf(post.date)}
									{#if post.draft}
										<span
											class="rounded-full border border-amber-500/50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400"
											>Draft</span
										>
									{/if}
								</span>
								<span
									class="mt-2 text-balance text-base font-semibold leading-snug tracking-tight text-foreground"
									>{post.title}</span
								>
								<span class="mt-2 line-clamp-3 grow text-sm leading-6 text-muted-foreground"
									>{post.description}</span
								>
								<span
									class="mt-4 inline-flex items-center gap-1 text-sm font-medium text-lime-600 dark:text-lime-400"
								>
									Read
									<ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
								</span>
							</a>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				{#if posts.length > 1}
					<Carousel.Previous class="-left-3 hidden lg:flex" />
					<Carousel.Next class="-right-3 hidden lg:flex" />
				{/if}
			</Carousel.Root>
		</div>
	{/if}
</section>
