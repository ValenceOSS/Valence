import type { ChangelogEntry } from './ChangelogEntry';

const theFirstRelease: ChangelogEntry = {
  slug: 'the-first-release',
  version: 'v0.1.0',
  date: '2026-09-13',
  title: 'The first release',
  summary:
    'Valence’s first tagged release: a top bar, rows that end, flat surfaces, previews and trickplay rebuilt, and fourteen findings from a security audit fixed.',
  sections: [
    {
      title: 'Where it starts',
      body: 'A top bar that says where you are, posters and rows that end rather than trailing off, and flat surfaces throughout. Previews and trickplay were rebuilt from scratch, and a scan now returns before the rendering is done, so a new library is browsable straight away.',
    },
  ],
  lists: [
    {
      title: 'Fixes',
      items: [
        'Fourteen findings from the security audit.',
        'Admin pages follow permissions rather than a stale role.',
        'Artwork is as large as the catalogue makes it.',
      ],
    },
  ],
};

export { theFirstRelease };
