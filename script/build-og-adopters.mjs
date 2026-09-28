// Render the social card for /adopters as a 1200x630 PNG.
//
//   node script/build-og-adopters.mjs
//
// The page's own figures, then a row of marks a stranger recognizes. Built
// the same way as the blog cards (script/build-og.mjs): an SVG rasterized
// with resvg into static/media/adopters-og.png and committed, so the site
// builds without this toolchain. Re-run it when adopters.json or
// adopter-stats.json changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('..', import.meta.url).pathname;

const W = 1200;
const H = 630;

const C = {
	bg: '#101310',
	card: '#171b15',
	border: '#2b3128',
	fg: '#f2f4ee',
	muted: '#9aa093',
	lime: '#84cc16'
};

const MONO = 'Menlo, Monaco, monospace';
const SANS = 'Helvetica Neue, Helvetica, Arial, sans-serif';

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const adopters = JSON.parse(readFileSync(`${root}src/lib/data/adopters.json`, 'utf8'));
const stats = JSON.parse(readFileSync(`${root}src/lib/data/adopter-stats.json`, 'utf8'));
const sectors = new Set(adopters.map((a) => a.category)).size;

/*
	The marks on the card, in the landing band's order and without its
	"no card twice" rule, since the card has no story row. Each resolves to a
	Simple Icons path from brand-icons.ts or a checked-in avatar PNG.
*/
const MARKS = [
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

// brand-icons.ts is TypeScript; the two maps it exports are plain enough to
// read with a pattern. A value beginning with # is a color, the other a path.
const source = readFileSync(`${root}src/lib/data/brand-icons.ts`, 'utf8');
const paths = {};
const colors = {};
for (const m of source.matchAll(/\n\t([a-z0-9]+):\s*\n?\s*'([^']*)'/g)) {
	if (m[2].startsWith('#')) colors[m[1]] = m[2];
	else paths[m[1]] ??= m[2];
}

const byName = new Map(adopters.map((a) => [a.name, a]));

function mark(name, x, y, size) {
	const a = byName.get(name);
	if (!a) throw new Error(`${name} is not in adopters.json`);
	const slug = a.icon ?? name.toLowerCase().replace(/[^a-z0-9]/g, '');
	const glyph = paths[slug];
	const inner = size - 24;
	if (glyph) {
		const fill = colors[slug] ?? C.fg;
		return `<g transform="translate(${x + 12} ${y + 12}) scale(${inner / 24})"><path d="${glyph}" fill="${fill}"/></g>`;
	}
	if (a.avatar) {
		const png = readFileSync(`${root}static${a.avatar}`).toString('base64');
		// Avatars are drawn for GitHub's white page; the plate keeps them legible.
		return `<rect x="${x + 10}" y="${y + 10}" width="${size - 20}" height="${size - 20}" rx="10" fill="#ffffff"/>
	<image x="${x + 12}" y="${y + 12}" width="${inner}" height="${inner}" href="data:image/png;base64,${png}"/>`;
	}
	throw new Error(`${name} has neither a glyph nor an avatar`);
}

const figures = [
	[`${adopters.length}`, 'teams'],
	[`${sectors}`, 'sectors'],
	[`${stats.ci}/${stats.checked}`, 'repos run it in CI'],
	[`${(stats.actionDependents ?? 0).toLocaleString('en-US')}`, 'repos use the Action']
];

// Layout: eyebrow, headline, four figures, a row of twelve marks, the URL.
const SIZE = 72;
const GAP = 19;
const rowW = MARKS.length * SIZE + (MARKS.length - 1) * GAP;
const rowX = (W - rowW) / 2;
const rowY = 404;

let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<rect width="${W}" height="${H}" fill="${C.bg}"/>
	<text x="64" y="104" font-family="${MONO}" font-size="20" letter-spacing="4" fill="${C.lime}">VALE.SH/ADOPTERS</text>
	<text x="64" y="196" font-family="${SANS}" font-size="84" font-weight="bold" fill="${C.fg}">${adopters.length} teams run Vale</text>
	<text x="64" y="250" font-family="${SANS}" font-size="30" fill="${C.muted}">Hyperscalers to observatories, each with a public config, package, or write-up.</text>
`;

figures.forEach(([value, label], i) => {
	const x = 64 + i * 268;
	svg += `	<text x="${x}" y="332" font-family="${SANS}" font-size="44" font-weight="bold" fill="${C.fg}">${esc(value)}</text>
	<text x="${x}" y="362" font-family="${MONO}" font-size="19" fill="${C.muted}">${esc(label)}</text>
`;
});

MARKS.forEach((name, i) => {
	const x = rowX + i * (SIZE + GAP);
	svg += `	<rect x="${x}" y="${rowY}" width="${SIZE}" height="${SIZE}" rx="14" fill="${C.card}" stroke="${C.border}"/>
	${mark(name, x, rowY, SIZE)}
`;
});

svg += `	<text x="${W - 64}" y="${H - 44}" text-anchor="end" font-family="${MONO}" font-size="22" fill="${C.muted}">vale.sh/adopters</text>
</svg>`;

const png = new Resvg(svg, {
	fitTo: { mode: 'width', value: W },
	font: { loadSystemFonts: true }
}).render();
writeFileSync(`${root}static/media/adopters-og.png`, png.asPng());
console.log(`wrote static/media/adopters-og.png (${adopters.length} teams, ${MARKS.length} marks)`);
