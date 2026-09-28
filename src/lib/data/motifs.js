/**
 * The nine sector drawings, as the SVG elements that go inside a 160x160
 * box drawn with `fill="none" stroke="currentColor" stroke-width="2"`.
 *
 * Kept as plain strings in a plain module so two renderers share them
 * unchanged: SectorMotif.svelte on the adopters page, and the card scripts
 * under script/, which run in Node and cannot import a component. The
 * markup is authored here, never from user input, which is what makes the
 * component's `{@html}` safe.
 *
 * Kinds are the sector ids the adopters page derives from sector names:
 * `sector-` plus the name lowercased with runs of non-alphanumerics as `-`.
 */

/** @param {number} n */
const f = (n) => Number(n.toFixed(2));

/** Node graph: three columns, every node joined to the next column. */
function ai() {
	let out = '';
	[30, 80, 130].forEach((x, col) => {
		for (const y of col === 1 ? [30, 65, 100, 135] : [50, 85, 120]) {
			out += `<circle cx="${x}" cy="${y}" r="6"/>`;
		}
	});
	for (const y1 of [50, 85, 120]) {
		for (const y2 of [30, 65, 100, 135]) {
			out += `<line x1="36" y1="${y1}" x2="74" y2="${y2}" opacity="0.5"/>`;
			out += `<line x1="86" y1="${y2}" x2="124" y2="${y1}" opacity="0.5"/>`;
		}
	}
	return out;
}

/** Stacked planes, the way a stack diagram draws layers. */
function cloud() {
	let out = '';
	for (const y of [40, 70, 100]) {
		out += `<path d="M30 ${y} L80 ${y - 22} L130 ${y} L80 ${y + 22} Z"/>`;
	}
	out += '<line x1="30" y1="100" x2="30" y2="118"/>';
	out += '<line x1="130" y1="100" x2="130" y2="118"/>';
	out += '<path d="M30 118 L80 140 L130 118"/>';
	return out;
}

/** A column of records with a sparkline across the top. */
function data() {
	let out = '';
	for (const y of [56, 84, 112]) {
		out += `<rect x="32" y="${y}" width="96" height="20" rx="4"/>`;
		out += `<line x1="44" y1="${y + 10}" x2="72" y2="${y + 10}" opacity="0.5"/>`;
	}
	out += '<polyline points="32,40 52,26 72,34 92,18 112,30 128,20"/>';
	return out;
}

/** A prompt and a cursor, plus the brackets a linter lives between. */
function developer() {
	return (
		'<path d="M40 60 L64 80 L40 100"/>' +
		'<line x1="76" y1="100" x2="108" y2="100"/>' +
		'<path d="M28 34 L18 34 L18 126 L28 126" opacity="0.5"/>' +
		'<path d="M132 34 L142 34 L142 126 L132 126" opacity="0.5"/>'
	);
}

/** A floor plan of windows: the building, one grid at a time. */
function enterprise() {
	let out = '<rect x="34" y="28" width="92" height="112" rx="4"/>';
	for (const y of [44, 68, 92, 116]) {
		for (const x of [46, 70, 94]) {
			out += `<rect x="${x}" y="${y}" width="16" height="12" rx="2" opacity="0.6"/>`;
		}
	}
	return out;
}

/** A chip with traces leaving on all four sides. */
function hardware() {
	let out = '<rect x="56" y="56" width="48" height="48" rx="6"/>';
	for (const p of [66, 80, 94]) {
		out += `<line x1="${p}" y1="56" x2="${p}" y2="30"/>`;
		out += `<line x1="${p}" y1="104" x2="${p}" y2="130"/>`;
		out += `<line x1="56" y1="${p}" x2="30" y2="${p}"/>`;
		out += `<line x1="104" y1="${p}" x2="130" y2="${p}"/>`;
		out += `<circle cx="${p}" cy="26" r="3" opacity="0.6"/>`;
		out += `<circle cx="${p}" cy="134" r="3" opacity="0.6"/>`;
		out += `<circle cx="26" cy="${p}" r="3" opacity="0.6"/>`;
		out += `<circle cx="134" cy="${p}" r="3" opacity="0.6"/>`;
	}
	return out;
}

/** A ring of contributors around one project. */
function openSource() {
	let out = '<circle cx="80" cy="80" r="12"/>';
	for (const deg of [0, 45, 90, 135, 180, 225, 270, 315]) {
		const r = (deg * Math.PI) / 180;
		const c = Math.cos(r);
		const s = Math.sin(r);
		out += `<circle cx="${f(80 + 50 * c)}" cy="${f(80 + 50 * s)}" r="7"/>`;
		out += `<line x1="${f(80 + 14 * c)}" y1="${f(80 + 14 * s)}" x2="${f(80 + 42 * c)}" y2="${f(80 + 42 * s)}" opacity="0.5"/>`;
	}
	return out;
}

/** Orbits, and a body on each: the observatory's view. */
function academia() {
	let out = '<circle cx="80" cy="80" r="8"/>';
	[28, 46, 64].forEach((r, i) => {
		out += `<ellipse cx="80" cy="80" rx="${r}" ry="${f(r * 0.45)}" transform="rotate(${-20 + i * 20} 80 80)" opacity="0.7"/>`;
	});
	out += '<circle cx="120" cy="66" r="4"/>';
	out += '<circle cx="42" cy="98" r="4"/>';
	return out;
}

/** Hexagons in a chain, each sharing an edge with the next. */
function web3() {
	let out = '';
	for (const [cx, cy] of [
		[46, 60],
		[80, 80],
		[114, 100]
	]) {
		out += `<path d="M${cx} ${cy - 22} L${cx + 19} ${cy - 11} L${cx + 19} ${cy + 11} L${cx} ${cy + 22} L${cx - 19} ${cy + 11} L${cx - 19} ${cy - 11} Z"/>`;
	}
	return out;
}

/** @type {Record<string, () => string>} */
const drawings = {
	'sector-ai-machine-learning': ai,
	'sector-cloud-infrastructure': cloud,
	'sector-data-observability': data,
	'sector-developer-tools': developer,
	'sector-enterprise-software': enterprise,
	'sector-hardware-semiconductors': hardware,
	'sector-open-source-communities': openSource,
	'sector-academia-public-sector': academia,
	'sector-web3-blockchain': web3
};

/**
 * The id the adopters page gives a sector, from its name.
 * @param {string} name
 */
export function sectorId(name) {
	return `sector-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * The SVG elements for one drawing, or an empty string for an unknown kind.
 * @param {string} kind
 */
export function motifMarkup(kind) {
	return drawings[kind]?.() ?? '';
}
