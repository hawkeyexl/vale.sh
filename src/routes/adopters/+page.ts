import { listPosts } from '$lib/posts';
import type { PageLoad } from './$types';

/*
	The posts the hero slides through: case studies first, then anything else
	filed under adopters, newest first within each. Drafts show in a local
	build so a post can be checked in its slot; a production build never sees
	them, the same rule the blog index uses.
*/
export const load: PageLoad = () => {
	const drafts = import.meta.env.DEV;
	const studies = listPosts({ drafts, tag: 'case-studies' });
	const rest = listPosts({ drafts, tag: 'adopters' }).filter(
		(p) => !studies.some((s) => s.slug === p.slug)
	);
	return {
		posts: [...studies, ...rest].map(
			({ slug, title, description, date, tags, image, imageAlt, draft }) => ({
				slug,
				title,
				description,
				date,
				tags: tags ?? [],
				// The branded card for a case study; a post without one gets no picture.
				image: image ?? null,
				imageAlt: imageAlt ?? '',
				// Only ever true in a local build, where drafts are listed for review.
				draft: Boolean(draft)
			})
		)
	};
};
