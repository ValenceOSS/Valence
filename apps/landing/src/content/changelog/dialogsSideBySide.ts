import type { ChangelogEntry } from './ChangelogEntry';

const dialogsSideBySide: ChangelogEntry = {
  slug: 'dialogs-side-by-side',
  version: 'v0.2.0',
  date: '2026-09-14',
  title: 'Dialogs that stand side by side',
  summary:
    'A dialog opened from another now stands beside it rather than on top of it, and forms keep their shape as you fill them in.',
  sections: [],
  lists: [
    {
      title: 'Improvements',
      items: [
        'Dialogs stand beside each other, and a form keeps one shape.',
        'Every image carries the version it was built from.',
      ],
    },
    {
      title: 'Under the hood',
      items: ['ESLint 10, oxlint 1 and jsdom 30, with seven tests jsdom caught fixed.'],
    },
  ],
};

export { dialogsSideBySide };
