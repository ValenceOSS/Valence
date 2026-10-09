import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PermissionEditor } from './PermissionEditor';

const requesting = vi.hoisted(() => ({ isEnabled: false, kinds: ['film'] }));

vi.mock('@ValenceClient/requests/fetchRequests', () => ({
  fetchRequestsAvailability: () => Promise.resolve(requesting),
}));

const NODES = [
  {
    node: 'plugin.anilist.sync' as const,
    pluginId: 'anilist',
    pluginName: 'AniList',
    title: 'Sync lists',
    description: 'Keep AniList in step with what was watched.',
  },
  {
    node: 'plugin.music-import.import' as const,
    pluginId: 'music-import',
    pluginName: 'Playlist import',
    title: 'Import playlists',
    description: null,
  },
];

describe('PermissionEditor', () => {
  it('lists plugins’ own permissions under each plugin, beneath Valence’s', async () => {
    const onToggle = vi.fn();

    renderInAnAddress(
      <PermissionEditor
        catalogue={['jobs.run']}
        pluginNodes={NODES}
        selected={['plugin.anilist.sync']}
        onToggle={onToggle}
      />,
    );

    expect(screen.getByText('From AniList')).toBeInTheDocument();
    expect(screen.getByText('From Playlist import')).toBeInTheDocument();
    expect(screen.getByText('Lets someone use this part of Playlist import.')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Sync lists' })).toBeChecked();

    await userEvent.click(screen.getByRole('switch', { name: 'Import playlists' }));

    expect(onToggle).toHaveBeenCalledWith('plugin.music-import.import');
  });

  it('finds a plugin’s permission by what it does, and says when nothing matches', async () => {
    renderInAnAddress(
      <PermissionEditor
        catalogue={['jobs.run']}
        pluginNodes={NODES}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search permissions' }), 'in step');

    expect(screen.getByText('Sync lists')).toBeInTheDocument();
    expect(screen.queryByText('Import playlists')).toBeNull();

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search permissions' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search permissions' }), 'zzzz');

    expect(screen.getByText('Nothing matches your search.')).toBeInTheDocument();
  });

  it('says a permission to ask for music lets nobody do anything where no music library takes requests', async () => {
    requesting.isEnabled = true;

    renderInAnAddress(
      <PermissionEditor
        catalogue={['requests.askMusic', 'requests.ask']}
        selected={[]}
        onToggle={vi.fn()}
      />,
    );

    expect(await screen.findByText(/No music library takes requests/)).toBeInTheDocument();
    expect(screen.queryByText(/No film, series or book library/)).toBeNull();
  });
});
