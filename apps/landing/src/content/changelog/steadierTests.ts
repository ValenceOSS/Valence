import type { ChangelogEntry } from './ChangelogEntry';

const steadierTests: ChangelogEntry = {
  slug: 'steadier-tests',
  version: 'v1.1.2',
  date: '2026-09-25',
  title: 'A steadier test suite',
  summary:
    'Nothing you will see here. The server’s tests that start a Postgres of their own now wait long enough for it on a busy machine.',
  sections: [],
  lists: [
    {
      title: 'Fixes',
      items: ['Tests that start their own database give it thirty seconds rather than ten.'],
    },
  ],
};

export { steadierTests };
