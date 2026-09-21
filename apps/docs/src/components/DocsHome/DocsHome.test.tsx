import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DocsHome } from '@ValenceDocs/components/DocsHome/DocsHome';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

const sections = [
  {
    id: 'start',
    title: 'Getting started',
    items: [{ path: '/start/introduction', title: 'Introduction', order: 1 }],
  },
  { id: 'empty', title: 'Nothing', items: [] },
];

describe('DocsHome', () => {
  it('offers a way into each section that has pages', async () => {
    await renderInDocsRouter(() => <DocsHome sections={sections} />);

    expect(await screen.findByRole('link', { name: /Getting started/ })).toHaveAttribute(
      'href',
      '/start/introduction',
    );
    expect(screen.queryByText('Nothing')).not.toBeInTheDocument();
  });
});
