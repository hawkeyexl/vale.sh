/**
 * Counts what the adopters' repos actually do with Vale, into
 * src/lib/data/adopter-stats.json:
 *
 *   - ci:        the repo's CI config (GitHub workflows, GitLab CI, CircleCI,
 *                Buildkite) mentions Vale, so it runs on pull requests
 *   - preCommit: .pre-commit-config.yaml mentions Vale
 *   - stars:     the repo's stargazer count
 *   - pushed:    when the repo last received a push
 *   - touched:   when the linked config file itself last changed, for an
 *                entry whose URL points at one
 *   - house:     the sampled .vale.ini bases itself on a style that is not a
 *                registry package -- rules the team wrote itself
 *   - vocab:     the sampled .vale.ini sets Vocab
 *
 * Only adopters whose URL points into a GitHub repo can be checked; the rest
 * are counted in `unchecked`. Every repo's CI files are read in one GraphQL
 * round of twenty, so the whole list takes a few requests.
 *
 * Run with: GITHUB_TOKEN=... node script/adopters-stats.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';

const ADOPTERS = new URL('../src/lib/data/adopters.json', import.meta.url);
const CONFIGS = new URL('../src/lib/data/config-stats.json', import.meta.url);
const OUT = new URL('../src/lib/data/adopter-stats.json', import.meta.url);

const token = process.env.GITHUB_TOKEN;
if (!token) {
	console.error('GITHUB_TOKEN is required: the GraphQL API does not serve anonymous requests.');
	process.exit(1);
}

/** Styles anyone can `vale sync`; anything else in BasedOnStyles is the team's own. */
const REGISTRY = new Set([
	'Vale',
	'Microsoft',
	'Google',
	'RedHat',
	'write-good',
	'proselint',
	'Joblint',
	'alex',
	'Readability',
	'Hugo',
	'AsciiDoc',
	'MDX',
	'ai-tells',
	'Openly'
]);

const adopters = JSON.parse(await readFile(ADOPTERS, 'utf8'));
const configs = JSON.parse(await readFile(CONFIGS, 'utf8'));

function repoOf(url) {
	const m = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/#?]+)/);
	return m ? { owner: m[1], name: m[2].replace(/\.git$/, '') } : null;
}

async function graphql(query) {
	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	if (!res.ok) throw new Error(`graphql -> ${res.status}`);
	const body = await res.json();
	if (body.errors && !body.data) throw new Error(JSON.stringify(body.errors).slice(0, 300));
	return body.data;
}

// The CI files a repo might keep Vale in. Workflows are a directory, read as
// a tree of blobs; the rest are single files.
const FILES = {
	gitlab: 'HEAD:.gitlab-ci.yml',
	circle: 'HEAD:.circleci/config.yml',
	buildkite: 'HEAD:.buildkite/pipeline.yml',
	preCommit: 'HEAD:.pre-commit-config.yaml'
};

function pathOf(url) {
	const m = url.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/(.+)$/);
	return m ? m[1] : null;
}

// One query slot per adopter, since two entries can share a repo but point
// at different files. Twenty per round.
const targets = adopters
	.map((a) => ({ name: a.name, repo: repoOf(a.url), path: pathOf(a.url) }))
	.filter((t) => t.repo);

const results = {};
for (let i = 0; i < targets.length; i += 20) {
	const chunk = targets.slice(i, i + 20);
	const parts = chunk.map((t, j) => {
		const { owner, name } = t.repo;
		const files = Object.entries(FILES)
			.map(([k, e]) => `${k}: object(expression: ${JSON.stringify(e)}) { ... on Blob { text } }`)
			.join(' ');
		const touched = t.path
			? `defaultBranchRef { target { ... on Commit { history(first: 1, path: ${JSON.stringify(t.path)}) { nodes { committedDate } } } } }`
			: '';
		return `r${j}: repository(owner: ${JSON.stringify(owner)}, name: ${JSON.stringify(name)}) {
			stargazerCount
			pushedAt
			workflows: object(expression: "HEAD:.github/workflows") {
				... on Tree { entries { name object { ... on Blob { text } } } }
			}
			${files}
			${touched}
		}`;
	});
	const data = await graphql(`{ ${parts.join('\n')} }`);
	chunk.forEach((t, j) => {
		const d = data[`r${j}`];
		if (!d) {
			results[t.name] = { missing: true };
			return;
		}
		const mentions = (text) => Boolean(text && /\bvale\b/i.test(text));
		const workflows = (d.workflows?.entries ?? []).filter((e) => mentions(e.object?.text));
		results[t.name] = {
			repo: `${t.repo.owner}/${t.repo.name}`,
			stars: d.stargazerCount,
			pushed: d.pushedAt?.slice(0, 10) ?? null,
			touched: d.defaultBranchRef?.target?.history?.nodes?.[0]?.committedDate?.slice(0, 10) ?? null,
			ci:
				workflows.length > 0 ||
				mentions(d.gitlab?.text) ||
				mentions(d.circle?.text) ||
				mentions(d.buildkite?.text),
			ciFiles: workflows.map((e) => `.github/workflows/${e.name}`),
			preCommit: mentions(d.preCommit?.text)
		};
	});
	console.log(`  checked ${Math.min(i + 20, targets.length)}/${targets.length}`);
}

// Per adopter, then the totals the page shows.
const sampledByName = new Map(configs.sampled.map((s) => [s.name, s]));
const today = new Date();
const daysAgo = (iso) => (iso ? Math.floor((today - new Date(iso)) / 86400000) : null);
const perAdopter = {};
const totals = {
	teams: adopters.length,
	checked: 0,
	unchecked: 0,
	ci: 0,
	preCommit: 0,
	stars: 0,
	active30: 0,
	active90: 0,
	touched90: 0,
	touchable: 0
};
const bySector = {};

for (const a of adopters) {
	const r = results[a.name];
	const hit = r && !r.missing ? r : null;
	const sampled = sampledByName.get(a.name);
	perAdopter[a.name] = {
		repo: hit ? hit.repo : null,
		ci: hit ? hit.ci : null,
		preCommit: hit ? hit.preCommit : null,
		stars: hit ? hit.stars : null,
		pushed: hit ? hit.pushed : null,
		touched: hit ? hit.touched : null,
		house: sampled ? sampled.styles.some((s) => !REGISTRY.has(s)) : null
	};

	const sector = (bySector[a.category] ??= {
		teams: 0,
		checked: 0,
		ci: 0,
		house: 0,
		stars: 0,
		active30: 0
	});
	sector.teams++;
	if (hit) {
		totals.checked++;
		sector.checked++;
		totals.stars += hit.stars;
		sector.stars += hit.stars;
		if (hit.ci) {
			totals.ci++;
			sector.ci++;
		}
		if (hit.preCommit) totals.preCommit++;
		const pushed = daysAgo(hit.pushed);
		if (pushed !== null && pushed <= 30) {
			totals.active30++;
			sector.active30++;
		}
		if (pushed !== null && pushed <= 90) totals.active90++;
		if (hit.touched !== null) {
			totals.touchable++;
			if (daysAgo(hit.touched) <= 90) totals.touched90++;
		}
	} else {
		totals.unchecked++;
	}
	if (perAdopter[a.name].house) sector.house++;
}

// The config-side counts, against the configs that were actually read.
const sampled = configs.sampled.length;
const house = configs.sampled.filter((s) => s.styles.some((x) => !REGISTRY.has(x))).length;
const vocab = configs.keys?.Vocab ?? 0;
const registryOnly = configs.sampled.filter(
	(s) => s.styles.length > 0 && s.styles.every((x) => REGISTRY.has(x))
).length;

await writeFile(
	OUT,
	JSON.stringify(
		{
			generated: new Date().toISOString().slice(0, 10),
			...totals,
			configs: { sampled, house, registryOnly, vocab },
			bySector,
			perAdopter
		},
		null,
		'\t'
	) + '\n'
);
console.log(
	`\n${totals.teams} teams: ${totals.checked} repos checked, ${totals.ci} run Vale in CI, ${totals.preCommit} in pre-commit, ${totals.stars} stars, ${totals.active30} pushed in 30 days, ${totals.touched90}/${totals.touchable} configs touched in 90 days; ${house}/${sampled} configs carry house rules, ${vocab} keep a Vocab.`
);
