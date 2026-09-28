import type { ChangelogEntry } from './ChangelogEntry';

const patchedImages: ChangelogEntry = {
  slug: 'patched-images',
  version: 'v1.1.1',
  date: '2026-09-25',
  title: 'Images that build from a clean checkout',
  summary:
    'The Docker images now carry the dependency patches they install against, so a build from a fresh clone matches the one we publish.',
  sections: [],
  lists: [
    {
      title: 'Fixes',
      items: [
        'Every image copies the patched dependencies in before installing, rather than after.',
      ],
    },
  ],
};

export { patchedImages };
