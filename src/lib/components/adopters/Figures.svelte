<script lang="ts">
	import stats from '$lib/data/adopter-stats.json';

	/*
		What the repos do, counted by script/adopters-stats.mjs rather than
		claimed: CI configs read for the word "vale", configs read for the
		styles they base on, agent instruction files read for the name. Each
		figure names its denominator, because they differ -- repos on GitHub,
		configs that could be opened, and all the repos checked.
	*/
	const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 0 });

	// Repos whose agent instructions name Vale, read from the per-adopter
	// integrations the stats script records.
	const agents = Object.values(stats.perAdopter).filter(
		(a) => (a as { integrations?: { agents?: string[] } | null }).integrations?.agents?.length
	).length;

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
			value: agents,
			of: stats.checked,
			label: 'tell their AI agents to run Vale',
			gloss: `of ${stats.checked} repos checked: an AGENTS.md, CLAUDE.md, Cursor rules, or Copilot instructions file that names Vale`
		},
		{
			value: stats.stars,
			label: 'GitHub stars, combined',
			gloss: `across the ${stats.checked} repos checked, as of ${stats.generated}`
		}
	];
</script>

<!--
	A stat tile each: value, label, and the line that says how it was counted.
	Three are ratios, so each carries a meter against its own denominator;
	the star total stands alone.
-->
<dl class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
