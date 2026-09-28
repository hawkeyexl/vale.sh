/**
 * Counts what the adopters' repos actually do with Vale, into
 * src/lib/data/adopter-stats.json:
 *
 *   - ci:        the repo's CI config (GitHub workflows, GitLab CI, CircleCI,
 *                Buildkite) mentions Vale, so it runs on pull requests
 *   - preCommit: .pre-commit-config.yaml mentions Vale
 *   - stars:     the repo's stargazer count
 *   - actionDependents: repositories depending on vale-cli/vale-action,
 *                from GitHub's dependents page (a total, not per adopter)
 *   - pushed:    when the repo last received a push
 *   - touched:   when the linked config file itself last changed, for an
 *                entry whose URL points at one
 *   - house:     the sampled .vale.ini bases itself on a style that is not a
 *                registry package -- rules the team wrote itself
 *   - vocab:     the sampled .vale.ini sets Vocab
 *   - styles, formats, level: what the sampled .vale.ini declares
 *   - proof:     what the entry's URL is -- a config file, a style package,
 *                a plain repository, or a write-up
 *   - integrations: the files in the repo that mention Vale, by surface --
 *                workflows (and whether they use the official Action),
 *                GitLab CI, CircleCI, Buildkite, pre-commit, agent
 *                instructions, task runners, VS Code settings, and the
 *                contributing guide -- so the directory can link to each
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

async function graphql(query, attempt = 1) {
	const res = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ query })
	});
	// A batch this wide can draw a 502 from the API on a slow day; back off
	// and ask again before giving up.
	if (res.status >= 500 && attempt < 4) {
		await new Promise((r) => setTimeout(r, 2000 * attempt));
		return graphql(query, attempt + 1);
	}
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
	preCommit: 'HEAD:.pre-commit-config.yaml',
	// The surfaces a newcomer copies from: agent instructions, task runners,
	// editor settings, and the contributing guide.
	agents: 'HEAD:AGENTS.md',
	docsAgents: 'HEAD:docs/AGENTS.md',
	claude: 'HEAD:CLAUDE.md',
	cursor: 'HEAD:.cursorrules',
	copilot: 'HEAD:.github/copilot-instructions.md',
	makefile: 'HEAD:Makefile',
	pkg: 'HEAD:package.json',
	justfile: 'HEAD:justfile',
	taskfile: 'HEAD:Taskfile.yml',
	vscode: 'HEAD:.vscode/settings.json',
	contributing: 'HEAD:CONTRIBUTING.md',
	docsContributing: 'HEAD:docs/CONTRIBUTING.md',
	ghContributing: 'HEAD:.github/CONTRIBUTING.md'
};

// Where each key lives in the repo, for the links the directory shows.
const PATHS = Object.fromEntries(
	Object.entries(FILES).map(([k, e]) => [k, e.slice('HEAD:'.length)])
);

/*
	What a reader lands on. A blob ending in vale.ini is a config. A GitHub
	repository or tree whose path says vale or style is a package of rules.
	Any other GitHub link is a repository, and everything else is a page the
	team wrote.
*/
function proofOf(url) {
	if (/^https:\/\/github\.com\/.+\/blob\/.+vale\.ini$/.test(url)) return 'config';
	if (/^https:\/\/github\.com\//.test(url)) {
		const path = url.replace(/^https:\/\/github\.com\//, '');
		return /vale|style/i.test(path) && !/\/blob\//.test(path) ? 'package' : 'repository';
	}
	return 'writeup';
}

function pathOf(url) {
	const m = url.match(/^https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/(.+)$/);
	return m ? m[1] : null;
}

// One query slot per adopter, since two entries can share a repo but point
// at different files. Ten per round: each slot reads a dozen or more blobs.
const targets = adopters
	.map((a) => ({ name: a.name, repo: repoOf(a.url), path: pathOf(a.url) }))
	.filter((t) => t.repo);

const results = {};
for (let i = 0; i < targets.length; i += 10) {
	const chunk = targets.slice(i, i + 10);
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
		const workflowText = workflows.map((e) => e.object.text).join('\n');
		const found = (keys) => keys.filter((k) => mentions(d[k]?.text)).map((k) => PATHS[k]);
		results[t.name] = {
			repo: `${t.repo.owner}/${t.repo.name}`,
			integrations: {
				actions: workflows.map((e) => `.github/workflows/${e.name}`),
				valeAction: /(errata-ai|vale-cli)\/vale-action/.test(workflowText),
				reviewdog: /vale-action@reviewdog/.test(workflowText),
				gitlab: found(['gitlab'])[0] ?? null,
				circle: found(['circle'])[0] ?? null,
				buildkite: found(['buildkite'])[0] ?? null,
				precommit: found(['preCommit'])[0] ?? null,
				agents: found(['agents', 'docsAgents', 'claude', 'cursor', 'copilot']),
				tasks: found(['makefile', 'pkg', 'justfile', 'taskfile']),
				vscode: found(['vscode'])[0] ?? null,
				contributing: found(['contributing', 'docsContributing', 'ghContributing'])
			},
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
	console.log(`  checked ${Math.min(i + 10, targets.length)}/${targets.length}`);
}

/*
	How many repositories depend on the official Action, from GitHub's own
	dependents page: the one adoption figure that reaches past this list. There
	is no API for it, so the page is read for its count, and if the markup
	ever changes the previous figure is kept rather than written as zero.
*/
async function actionDependents(previous) {
	try {
		const res = await fetch('https://github.com/vale-cli/vale-action/network/dependents', {
			headers: { 'User-Agent': 'vale.sh adopters-stats' }
		});
		const html = (await res.text()).replace(/\s+/g, ' ');
		const m = html.match(/([0-9][0-9,]*) Repositories/);
		if (m) return Number(m[1].replace(/,/g, ''));
		console.warn('  dependents: count not found on the page, keeping the previous figure');
	} catch (err) {
		console.warn(`  dependents: ${err.message}, keeping the previous figure`);
	}
	return previous ?? null;
}

let previousDependents = null;
try {
	previousDependents = JSON.parse(await readFile(OUT, 'utf8')).actionDependents ?? null;
} catch {
	// First run: nothing to fall back to.
}
const dependents = await actionDependents(previousDependents);

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
		proof: proofOf(a.url),
		styles: sampled ? sampled.styles : null,
		formats: sampled ? (sampled.formats ?? []) : null,
		vocab: sampled ? (sampled.keys ?? []).includes('Vocab') : null,
		level: sampled ? (sampled.minAlertLevel ?? null) : null,
		repo: hit ? hit.repo : null,
		integrations: hit ? hit.integrations : null,
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
			actionDependents: dependents,
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
