// Render a branded card for each post that names an adopter.
//
//   node script/build-og-brand.mjs
//
// A case study is about one team, so its card is that team's mark on a plate
// over the pattern its sector wears on the adopters page, in that sector's
// hue. No title: on the post page the banner sits under the heading, and in
// an unfurl the title is text beside the image, so a title in the picture
// would read twice either way. Posts opt in with `brand: <adopter name>` in
// their frontmatter; the card lands at static/blog/brand/<slug>.png and the
// post points at it with `image`, which both the banner and the social card
// honor. Built like the other cards: an SVG rasterized with resvg and
// committed.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { parse } from 'yaml';
import { motifMarkup, sectorId } from '../src/lib/data/motifs.js';

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

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const adopters = JSON.parse(readFileSync(`${root}src/lib/data/adopters.json`, 'utf8'));
const byName = new Map(adopters.map((a) => [a.name, a]));

// brand-icons.ts and sectors.ts are TypeScript; the maps this needs are plain
// enough to read with a pattern. In brand-icons a value beginning with # is a
// color, the other a path. In sectors.ts each sector's block names its hue's
// hex, and the sector's name precedes it.
const icons = readFileSync(`${root}src/lib/data/brand-icons.ts`, 'utf8');
const paths = {};
const colors = {};
for (const m of icons.matchAll(/\n\t([a-z0-9]+):\s*\n?\s*'([^']*)'/g)) {
	if (m[2].startsWith('#')) colors[m[1]] = m[2];
	else paths[m[1]] ??= m[2];
}

const sectorsSrc = readFileSync(`${root}src/lib/data/sectors.ts`, 'utf8');
const themeHex = {};
for (const m of sectorsSrc.matchAll(/\n\t(\w+): \{\n(?:.*\n)*?\t\thex: '(#[0-9a-f]{6})'/g)) {
	themeHex[m[1]] = m[2];
}
const sectorHex = {};
for (const m of sectorsSrc.matchAll(/name: '([^']+)',\n(?:.*\n)*?\t\ttheme: themes\.(\w+)/g)) {
	sectorHex[m[1]] = themeHex[m[2]] ?? C.lime;
}

/** The mark in a rounded plate, `size` on a side, at (x, y). */
function mark(a, x, y, size) {
	const slug = a.icon ?? a.name.toLowerCase().replace(/[^a-z0-9]/g, '');
	const glyph = paths[slug];
	const pad = Math.round(size * 0.22);
	const inner = size - pad * 2;
	const plate = `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="${C.card}" stroke="${C.border}" stroke-width="2"/>`;
	if (glyph) {
		const fill = colors[slug] ?? C.fg;
		return `${plate}<g transform="translate(${x + pad} ${y + pad}) scale(${inner / 24})"><path d="${glyph}" fill="${fill}"/></g>`;
	}
	if (a.avatar) {
		const png = readFileSync(`${root}static${a.avatar}`).toString('base64');
		// Avatars are drawn for GitHub's white page; the plate keeps them legible.
		return `${plate}<rect x="${x + pad - 8}" y="${y + pad - 8}" width="${inner + 16}" height="${inner + 16}" rx="16" fill="#ffffff"/>
	<image x="${x + pad}" y="${y + pad}" width="${inner}" height="${inner}" href="data:image/png;base64,${png}"/>`;
	}
	throw new Error(`${a.name} has neither a glyph nor an avatar`);
}

mkdirSync(`${root}static/blog/brand`, { recursive: true });

let count = 0;
for (const file of readdirSync(`${root}src/posts`).sort()) {
	if (!file.endsWith('.md')) continue;
	const slug = file.replace(/\.md$/, '');
	const text = readFileSync(`${root}src/posts/${file}`, 'utf8');
	const fm = /^---\n([\s\S]*?)\n---/.exec(text);
	if (!fm) continue;
	const meta = parse(fm[1]);
	if (!meta.brand) continue;

	const a = byName.get(meta.brand);
	if (!a) throw new Error(`${file}: brand "${meta.brand}" is not in adopters.json`);
	const kind = sectorId(a.category);
	const hue = sectorHex[a.category] ?? C.lime;

	// Composed for two crops. The post page shows this image in a banner
	// about three times as wide as it is tall, so object-cover keeps only
	// the middle band; the blog index's featured slot is a tall column, so
	// it keeps only the middle third of the width. What survives both is the
	// central square, roughly 520 by 370, so the plate and the label stack
	// inside it and the pattern fills the rest.
	const SIZE = 250;
	const x = (W - SIZE) / 2;
	const y = 136;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
	<defs>
		<pattern id="motif" width="176" height="176" patternUnits="userSpaceOnUse">
			<svg viewBox="0 0 160 160" width="160" height="160" fill="none" stroke="${hue}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${motifMarkup(kind)}</svg>
		</pattern>
		<radialGradient id="fade" cx="50%" cy="48%" r="50%">
			<stop offset="0" stop-color="#000"/>
			<stop offset="0.55" stop-color="#000"/>
			<stop offset="1" stop-color="#fff"/>
		</radialGradient>
		<mask id="edges"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
	</defs>
	<rect width="${W}" height="${H}" fill="${C.bg}"/>
	<rect width="${W}" height="${H}" fill="url(#motif)" opacity="0.28" mask="url(#edges)"/>
	${mark(a, x, y, SIZE)}
	<text x="${W / 2}" y="${y + SIZE + 46}" text-anchor="middle" font-family="${MONO}" font-size="22" letter-spacing="4" fill="${hue}">CASE STUDY</text>
	<text x="${W / 2}" y="${y + SIZE + 92}" text-anchor="middle" font-family="${MONO}" font-size="36" letter-spacing="2" fill="${C.fg}">${esc(a.name.toUpperCase())}</text>
</svg>`;

	const png = new Resvg(svg, {
		fitTo: { mode: 'width', value: W },
		font: { loadSystemFonts: true }
	}).render();
	writeFileSync(`${root}static/blog/brand/${slug}.png`, png.asPng());
	count++;
}
console.log(`static/blog/brand: ${count} card(s)`);
