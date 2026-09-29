import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CatalogueEntryRow } from './CatalogueEntryRow';
import type { CatalogueEntryRowProps } from './CatalogueEntryRow.types';

const ENTRY: CatalogueEntryRowProps['entry'] = {
  id: 'music-import',
  name: 'Music import',
  description: 'Brings your playlists in.',
  author: 'Valence',
  version: '1.2.0',
  kinds: ['extension', 'theme'],
  permissions: [],
  iconUrl: null,
  sourceUrl: 'https://github.com/ValenceOSS/valence-plugins',
  installedVersion: null,
  isCompatible: true,
};

describe('CatalogueEntryRow', () => {
  it('offers to install a plugin not yet here', async () => {
    const onInstall = vi.fn();

    renderInAnAddress(
      <ul>
        <CatalogueEntryRow entry={ENTRY} isBusy={false} onInstall={onInstall} />
      </ul>,
    );

    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Source' })).toHaveAttribute('href', ENTRY.sourceUrl);

    await userEvent.click(screen.getByRole('button', { name: 'Install' }));

    expect(onInstall).toHaveBeenCalled();
  });

  it('offers an update, says when it is already current, and when this server is too old', () => {
    const { rerender } = renderInAnAddress(
      <ul>
        <CatalogueEntryRow
          entry={{ ...ENTRY, installedVersion: '1.0.0' }}
          isBusy={false}
          onInstall={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByRole('button', { name: 'Update to 1.2.0' })).toBeInTheDocument();

    rerender(
      <ul>
        <CatalogueEntryRow
          entry={{ ...ENTRY, installedVersion: '1.2.0' }}
          isBusy={false}
          onInstall={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText('Installed')).toBeInTheDocument();

    rerender(
      <ul>
        <CatalogueEntryRow
          entry={{ ...ENTRY, isCompatible: false }}
          isBusy={false}
          onInstall={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText('Needs a newer Valence')).toBeInTheDocument();
  });
});
