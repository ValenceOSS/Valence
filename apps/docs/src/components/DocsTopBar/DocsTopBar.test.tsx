import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderInDocsRouter } from '@ValenceDocs/testing/renderInDocsRouter';
import { DocsTopBar } from './DocsTopBar';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DocsTopBar', () => {
  it('leads home to the docs themselves', async () => {
    await renderInDocsRouter(DocsTopBar);

    expect(await screen.findByRole('link', { name: 'Valence Docs' })).toHaveAttribute('href', '/');
  });

  it('opens the code and the Discord in new tabs, drawn alike', async () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const user = userEvent.setup();

    await renderInDocsRouter(DocsTopBar);

    const github = await screen.findByRole('button', { name: 'View the source on GitHub' });
    const discord = screen.getByRole('button', { name: 'Join the Discord' });

    expect(discord.className).toBe(github.className);

    await user.click(github);
    await user.click(discord);

    expect(open).toHaveBeenCalledWith(
      'https://github.com/ValenceOSS/Valence',
      '_blank',
      'noopener,noreferrer',
    );
    expect(open).toHaveBeenCalledWith(
      'https://discord.gg/uTtcAHMy9N',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('opens the list of pages on a narrow screen, and closes it again', async () => {
    const user = userEvent.setup();

    await renderInDocsRouter(DocsTopBar);

    await user.click(await screen.findByRole('button', { name: 'Open the list of pages' }));

    expect(await screen.findByRole('dialog', { name: 'Documentation pages' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Documentation pages' })).not.toBeInTheDocument();
  });

  it('closes the list of pages once a page is chosen from it', async () => {
    const user = userEvent.setup();

    await renderInDocsRouter(DocsTopBar);

    await user.click(await screen.findByRole('button', { name: 'Open the list of pages' }));

    const list = await screen.findByRole('dialog', { name: 'Documentation pages' });

    await user.click(within(list).getByRole('link', { name: 'Audiobooks' }));

    expect(screen.queryByRole('dialog', { name: 'Documentation pages' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(DocsTopBar.displayName).toBe('DocsTopBar');
  });
});
