import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DocsSearch } from '@ValenceDocs/components/DocsSearch/DocsSearch';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';
import type { DocPage } from '@ValenceDocs/content/DocPage.types';

const page = (path: string, title: string): DocPage => ({
  path,
  section: 'install',
  sectionTitle: 'Install',
  title,
  description: `About ${title}.`,
  order: 1,
  load: () => Promise.reject(new Error('not loaded in a test')),
});

describe('DocsSearch', () => {
  it('reads the pages on first use and finds a match', async () => {
    const read = vi.fn(() => Promise.resolve('---\ntitle: X\n---\nPut nginx in front of it.'));
    const user = userEvent.setup();

    await renderInDocsRouter(() => (
      <DocsSearch
        pages={[page('/install/reverse-proxy', 'Reverse proxy')]}
        sources={{ './install/reverse-proxy.mdx': read }}
      />
    ));

    expect(read).not.toHaveBeenCalled();

    await user.type(await screen.findByRole('searchbox'), 'nginx');

    expect(await screen.findByRole('link', { name: /Reverse proxy/ })).toHaveAttribute(
      'href',
      '/install/reverse-proxy',
    );
  });

  it('says when nothing matches', async () => {
    const user = userEvent.setup();

    await renderInDocsRouter(() => <DocsSearch pages={[page('/install/a', 'A')]} sources={{}} />);

    await user.type(await screen.findByRole('searchbox'), 'zzz');

    expect(await screen.findByText('Nothing matches that.')).toBeInTheDocument();
  });
});
