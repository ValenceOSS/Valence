import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
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
  beforeAll(() => {
    Element.prototype.scrollIntoView = () => undefined;
  });

  it('opens a palette listing every page from the button', async () => {
    const user = userEvent.setup();

    await renderInDocsRouter(() => (
      <DocsSearch pages={[page('/install/a', 'Alpha'), page('/install/b', 'Beta')]} sources={{}} />
    ));

    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Search the documentation' }));

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('opens from Ctrl and K', async () => {
    const user = userEvent.setup();

    await renderInDocsRouter(() => (
      <DocsSearch pages={[page('/install/a', 'Alpha')]} sources={{}} />
    ));
    await user.keyboard('{Control>}k{/Control}');

    expect(await screen.findByRole('combobox')).toBeInTheDocument();
  });

  it('reads the pages on first use and finds a match in their text', async () => {
    const read = vi.fn(() => Promise.resolve('---\ntitle: X\n---\nPut nginx in front of it.'));
    const user = userEvent.setup();

    await renderInDocsRouter(() => (
      <DocsSearch
        pages={[page('/install/reverse-proxy', 'Reverse proxy'), page('/install/b', 'Other')]}
        sources={{ './install/reverse-proxy.mdx': read }}
      />
    ));

    expect(read).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Search the documentation' }));
    await user.type(await screen.findByRole('combobox'), 'nginx');

    expect(await screen.findByText('Reverse proxy')).toBeInTheDocument();
    expect(screen.queryByText('Other')).not.toBeInTheDocument();
  });
});
