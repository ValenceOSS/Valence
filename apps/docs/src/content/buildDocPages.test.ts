import { describe, expect, it } from 'vitest';
import { buildDocPages } from '@ValenceDocs/content/buildDocPages';

const load = () => Promise.reject(new Error('not loaded in a test'));

const file = (path: string, title: string, order: number) => ({
  file: path,
  frontmatter: { title, description: `About ${title}.`, order },
  load,
});

describe('buildDocPages', () => {
  it('addresses a page by where its file sits', () => {
    const [page] = buildDocPages([file('./start/quick-start.mdx', 'Quick start', 1)]);

    expect(page).toMatchObject({
      path: '/start/quick-start',
      section: 'start',
      sectionTitle: 'Getting started',
      title: 'Quick start',
    });
  });

  it('orders by section, then by the order each page asks for', () => {
    const pages = buildDocPages([
      file('./install/b.mdx', 'B', 2),
      file('./reference/z.mdx', 'Z', 1),
      file('./install/a.mdx', 'A', 1),
      file('./start/s.mdx', 'S', 5),
    ]);

    expect(pages.map((page) => page.path)).toEqual([
      '/start/s',
      '/install/a',
      '/install/b',
      '/reference/z',
    ]);
  });

  it('refuses a file that is in no section', () => {
    expect(() => buildDocPages([file('./misc/x.mdx', 'X', 1)])).toThrow('is not in a section');
  });

  it('refuses a file that sits at the top', () => {
    expect(() => buildDocPages([file('./x.mdx', 'X', 1)])).toThrow('is not in a section');
  });

  it('names the file whose frontmatter is incomplete', () => {
    expect(() =>
      buildDocPages([{ file: './start/x.mdx', frontmatter: { title: 'X' }, load }]),
    ).toThrow('./start/x.mdx has incomplete frontmatter');
  });
});
