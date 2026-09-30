import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { PluginsPage } from './PluginsPage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PluginsPage', () => {
  it('says what keeps a plugin safe and lists the official plugins', () => {
    render(
      <PluginsPage
        plugins={[
          aCatalogueEntry(),
          aCatalogueEntry({ id: 'music-import', name: 'Playlist import' }),
        ]}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Plugins' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Runs on your server' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Signed' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Official plugins' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Playlist import' })).toBeInTheDocument();
  });

  it('takes a would-be author to the guide, and anybody curious to the plugin docs', async () => {
    const assign = vi.fn();

    vi.stubGlobal('location', { ...window.location, assign });
    render(<PluginsPage plugins={[aCatalogueEntry()]} />);

    await userEvent.click(screen.getByRole('button', { name: 'Write your own' }));
    await userEvent.click(screen.getByRole('button', { name: 'Read the plugin docs' }));

    expect(assign).toHaveBeenNthCalledWith(
      1,
      'https://docs.getvalence.app/plugins/getting-started',
    );
    expect(assign).toHaveBeenNthCalledWith(2, 'https://docs.getvalence.app/use/plugins');
  });

  it('says the first plugins are coming when the catalogue is empty, as it is under test', () => {
    render(<PluginsPage />);

    expect(
      screen.getByText(/The official catalogue could not be read just now/),
    ).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Official plugins' })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PluginsPage.displayName).toBe('PluginsPage');
  });
});
