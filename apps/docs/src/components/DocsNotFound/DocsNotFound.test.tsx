import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type * as Router from '@tanstack/react-router';
import { DocsNotFound } from '@ValenceDocs/components/DocsNotFound/DocsNotFound';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  useNavigate: () => navigate,
}));

describe('DocsNotFound', () => {
  it('says the page is not there and leads home', async () => {
    const user = userEvent.setup();

    await renderInDocsRouter(() => <DocsNotFound />, '/missing');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'That page is not here' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Back to the documentation home' }));

    expect(navigate).toHaveBeenCalledWith({ to: '/' });
  });
});
