import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DocsNav } from '@ValenceDocs/components/DocsNav/DocsNav';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

const sections = [
  {
    id: 'start',
    title: 'Getting started',
    items: [{ path: '/start/introduction', title: 'Introduction', order: 1 }],
  },
];

describe('DocsNav', () => {
  it('lists each section with its pages', async () => {
    await renderInDocsRouter(() => <DocsNav sections={sections} />);

    expect(await screen.findByText('Getting started')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Introduction' })).toHaveAttribute(
      'href',
      '/start/introduction',
    );
  });

  it('says when a page is chosen', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    await renderInDocsRouter(() => <DocsNav sections={sections} onNavigate={onNavigate} />);
    await user.click(await screen.findByRole('link', { name: 'Introduction' }));

    expect(onNavigate).toHaveBeenCalled();
  });
});
