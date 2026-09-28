<script lang="ts">
	import { motifMarkup } from '$lib/data/motifs.js';

	/*
		A line drawing for a sector band, one per sector, drawn for what the
		sector does rather than picked from an icon set. The drawings live in
		src/lib/data/motifs.js so the card scripts under script/ can draw the
		same ones; this component only frames them. All nine share one 160x160
		box, one stroke width, and currentColor, so the band's accent hue and
		opacity are set from outside and the drawings differ only in shape.
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

<!-- The markup is authored in motifs.js, never from data, so @html is safe here. -->
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
	{@html motifMarkup(kind)}
</svg>
