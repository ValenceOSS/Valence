import { describe, expect, it } from 'vitest';
import { buildNavigation } from '@ValenceDocs/content/buildNavigation';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';

const page = (path: string, section: string, title: string, order: number): DocPage => ({
  path,
  section,
  sectionTitle: section,
  title,
  description: '',
  order,
  load: () => Promise.reject(new Error('not loaded in a test')),
});

describe('buildNavigation', () => {
  it('groups pages by section in the order the site lists them', () => {
    const sections = buildNavigation([
      page('/install/a', 'install', 'A', 1),
      page('/start/b', 'start', 'B', 1),
    ]);

    expect(sections.map((section) => section.id)).toEqual(['start', 'install']);
  });

  it('leaves out a section with nothing in it', () => {
    expect(buildNavigation([page('/start/b', 'start', 'B', 1)])).toHaveLength(1);
  });

  it('slots an extra link among the pages by its order', () => {
    const [section] = buildNavigation(
      [page('/reference/a', 'reference', 'A', 1), page('/reference/c', 'reference', 'C', 3)],
      [{ section: 'reference', path: '/api', title: 'API reference', order: 2 }],
    );

    expect(section?.items.map((item) => item.path)).toEqual([
      '/reference/a',
      '/api',
      '/reference/c',
    ]);
  });
});
