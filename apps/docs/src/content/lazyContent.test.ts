import { describe, expect, it } from 'vitest';
import { lazyContent } from '@ValenceDocs/content/lazyContent';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';

const page: DocPage = {
  path: '/start/x',
  section: 'start',
  sectionTitle: 'Getting started',
  title: 'X',
  description: 'About X.',
  order: 1,
  load: () => Promise.resolve({ default: () => null }),
};

describe('lazyContent', () => {
  it('hands back the same component for the same page', () => {
    expect(lazyContent(page)).toBe(lazyContent(page));
  });

  it('makes a different one for a different page', () => {
    expect(lazyContent({ ...page, path: '/start/y' })).not.toBe(lazyContent(page));
  });
});
