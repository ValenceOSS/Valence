import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { aCatalogueEntry } from '@ValenceLanding/testing/aCatalogueEntry';
import { PluginsPage } from './PluginsPage';

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
    expect(screen.getByRole('list', { name: 'Official plugins' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Playlist import' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Write your own/ })).toHaveAttribute(
      'href',
      'https://docs.getvalence.app/plugins/getting-started',
    );
  });

  it('says the first plugins are coming when the catalogue is empty, as it is under test', () => {
    render(<PluginsPage />);

    expect(screen.getByText(/The official catalogue could not be read just now/)).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Official plugins' })).not.toBeInTheDocument();
  });
});
