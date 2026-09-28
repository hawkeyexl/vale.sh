import Brain from 'lucide-svelte/icons/brain';
import Cloud from 'lucide-svelte/icons/cloud';
import Database from 'lucide-svelte/icons/database';
import Terminal from 'lucide-svelte/icons/terminal';
import Building2 from 'lucide-svelte/icons/building-2';
import Cpu from 'lucide-svelte/icons/cpu';
import Users from 'lucide-svelte/icons/users';
import GraduationCap from 'lucide-svelte/icons/graduation-cap';
import Blocks from 'lucide-svelte/icons/blocks';

/**
 * The nine sectors an adopter files under, in the order the directory shows
 * them. `name` is the `category` value in adopters.json; the validator in
 * script/adopters.mjs keeps the two lists in step.
 */
export type Sector = {
	name: string;
	blurb: string;
	// Typed off one icon, the way AdopterConfigs types its kind map.
	icon: typeof Brain;
};

export const sectors: Sector[] = [
	{
		name: 'AI & machine learning',
		blurb: 'Model platforms, agent frameworks, and the SDKs around them.',
		icon: Brain
	},
	{
		name: 'Cloud & infrastructure',
		blurb: 'Hyperscalers, hosting, Kubernetes, and infrastructure as code.',
		icon: Cloud
	},
	{
		name: 'Data & observability',
		blurb: 'Databases, pipelines, and the monitoring built on top of them.',
		icon: Database
	},
	{
		name: 'Developer tools',
		blurb: 'Source control, CI, APIs, and the platforms developers build on.',
		icon: Terminal
	},
	{
		name: 'Enterprise software',
		blurb: 'Banking, commerce, and low-code platforms with public docs.',
		icon: Building2
	},
	{
		name: 'Hardware & semiconductors',
		blurb: 'Chip makers and embedded SDKs whose docs ship with the silicon.',
		icon: Cpu
	},
	{
		name: 'Open source & communities',
		blurb: 'Operating systems, foundations, frameworks, and writing communities.',
		icon: Users
	},
	{
		name: 'Academia & public sector',
		blurb: 'Government services, observatories, quantum computing, and research platforms.',
		icon: GraduationCap
	},
	{
		name: 'Web3 & blockchain',
		blurb: 'Wallets, chains, and the developer docs around them.',
		icon: Blocks
	}
];
