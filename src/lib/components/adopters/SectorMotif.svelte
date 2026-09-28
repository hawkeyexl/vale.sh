<script lang="ts">
	/*
		A line drawing for the corner of a sector band, one per sector, drawn
		for what the sector does rather than picked from an icon set: a node
		graph for AI, stacked planes for cloud, a column of records for data, a
		prompt for developer tools, a floor of windows for enterprise, circuit
		traces for hardware, a ring of contributors for open source, orbits for
		academia, chained hexagons for Web3.

		All nine share one 160x160 box, one stroke width, and currentColor, so
		the band's accent hue and opacity are set from outside and the
		drawings differ only in shape.
	*/
	let {
		kind,
		size,
		class: klass = ''
	}: {
		kind: string;
		/** Width and height in user units, for use inside an SVG pattern. */
		size?: number;
		class?: string;
	} = $props();
</script>

<svg
	viewBox="0 0 160 160"
	width={size}
	height={size}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	class={klass}
>
	{#if kind === 'sector-ai-machine-learning'}
		<!-- Node graph: three columns, every node joined to the next column. -->
		{#each [30, 80, 130] as x, col}
			{#each col === 1 ? [30, 65, 100, 135] : [50, 85, 120] as y}
				<circle cx={x} cy={y} r="6" />
			{/each}
		{/each}
		{#each [50, 85, 120] as y1}
			{#each [30, 65, 100, 135] as y2}
				<line x1="36" {y1} x2="74" {y2} opacity="0.5" />
				<line x1="86" y1={y2} x2="124" y2={y1} opacity="0.5" />
			{/each}
		{/each}
	{:else if kind === 'sector-cloud-infrastructure'}
		<!-- Stacked planes, the way a stack diagram draws layers. -->
		{#each [40, 70, 100] as y}
			<path d="M30 {y} L80 {y - 22} L130 {y} L80 {y + 22} Z" />
		{/each}
		<line x1="30" y1="100" x2="30" y2="118" />
		<line x1="130" y1="100" x2="130" y2="118" />
		<path d="M30 118 L80 140 L130 118" />
	{:else if kind === 'sector-data-observability'}
		<!-- A column of records with a sparkline across the top. -->
		{#each [56, 84, 112] as y}
			<rect x="32" {y} width="96" height="20" rx="4" />
			<line x1="44" y1={y + 10} x2="72" y2={y + 10} opacity="0.5" />
		{/each}
		<polyline points="32,40 52,26 72,34 92,18 112,30 128,20" />
	{:else if kind === 'sector-developer-tools'}
		<!-- A prompt and a cursor, plus the brackets a linter lives between. -->
		<path d="M40 60 L64 80 L40 100" />
		<line x1="76" y1="100" x2="108" y2="100" />
		<path d="M28 34 L18 34 L18 126 L28 126" opacity="0.5" />
		<path d="M132 34 L142 34 L142 126 L132 126" opacity="0.5" />
	{:else if kind === 'sector-enterprise-software'}
		<!-- A floor plan of windows: the building, one grid at a time. -->
		<rect x="34" y="28" width="92" height="112" rx="4" />
		{#each [44, 68, 92, 116] as y}
			{#each [46, 70, 94] as x}
				<rect {x} {y} width="16" height="12" rx="2" opacity="0.6" />
			{/each}
		{/each}
	{:else if kind === 'sector-hardware-semiconductors'}
		<!-- A chip with traces leaving on all four sides. -->
		<rect x="56" y="56" width="48" height="48" rx="6" />
		{#each [66, 80, 94] as p}
			<line x1={p} y1="56" x2={p} y2="30" />
			<line x1={p} y1="104" x2={p} y2="130" />
			<line x1="56" y1={p} x2="30" y2={p} />
			<line x1="104" y1={p} x2="130" y2={p} />
			<circle cx={p} cy="26" r="3" opacity="0.6" />
			<circle cx={p} cy="134" r="3" opacity="0.6" />
			<circle cx="26" cy={p} r="3" opacity="0.6" />
			<circle cx="134" cy={p} r="3" opacity="0.6" />
		{/each}
	{:else if kind === 'sector-open-source-communities'}
		<!-- A ring of contributors around one project. -->
		<circle cx="80" cy="80" r="12" />
		{#each [0, 45, 90, 135, 180, 225, 270, 315] as deg}
			{@const r = (deg * Math.PI) / 180}
			{@const x = 80 + 50 * Math.cos(r)}
			{@const y = 80 + 50 * Math.sin(r)}
			<circle cx={x} cy={y} r="7" />
			<line
				x1={80 + 14 * Math.cos(r)}
				y1={80 + 14 * Math.sin(r)}
				x2={80 + 42 * Math.cos(r)}
				y2={80 + 42 * Math.sin(r)}
				opacity="0.5"
			/>
		{/each}
	{:else if kind === 'sector-academia-public-sector'}
		<!-- Orbits, and a body on each: the observatory's view. -->
		<circle cx="80" cy="80" r="8" />
		{#each [28, 46, 64] as r, i}
			<ellipse
				cx="80"
				cy="80"
				rx={r}
				ry={r * 0.45}
				transform="rotate({-20 + i * 20} 80 80)"
				opacity="0.7"
			/>
		{/each}
		<circle cx="120" cy="66" r="4" />
		<circle cx="42" cy="98" r="4" />
	{:else if kind === 'sector-web3-blockchain'}
		<!-- Hexagons in a chain, each sharing an edge with the next. -->
		{#each [[46, 60], [80, 80], [114, 100]] as [cx, cy]}
			<path
				d="M{cx} {cy - 22} L{cx + 19} {cy - 11} L{cx + 19} {cy + 11} L{cx} {cy + 22} L{cx -
					19} {cy + 11} L{cx - 19} {cy - 11} Z"
			/>
		{/each}
	{/if}
</svg>
