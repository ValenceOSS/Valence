import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import type { MyPermissions } from '@ValenceContracts/schemas/Permission';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PermissionEditor } from './PermissionEditor';
import type { PermissionEditorProps } from './PermissionEditor.types';

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

const A_SOURCE = {
  pluginId: 'stream-source',
  pluginName: 'Streams',
  sourceId: 'web',
  title: 'Web',
};

const ADMINISTERING: MyPermissions = { permissions: [], isAdministrator: true };

/**
 * Draws the editor with what the server said about plugins and about the reader already known, so
 * nothing about it waits on an answer.
 *
 * @param props - The editor's own props.
 * @param known - What the plugins add and what the reader may do.
 */
const drawKnowing = (
  props: Omit<PermissionEditorProps, 'onToggle'> & { onToggle?: PermissionEditorProps['onToggle'] },
  known: { contributions?: PluginContributions; mine?: MyPermissions } = {},
) => {
  const answers = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });

  answers.setQueryData(
    pluginQueries.contributions().queryKey,
    known.contributions ?? somePluginContributions(),
  );
  answers.setQueryData(sessionQueries.permissions().queryKey, known.mine ?? ADMINISTERING);

  render(
    <QueryClientProvider client={answers}>
      <PermissionEditor onToggle={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
};

/**
 * Finds the row holding one permission's switch.
 *
 * @param name - What the permission is called.
 * @returns The row.
 */
const rowOf = (name: string): HTMLElement => {
  const row = screen
    .getAllByRole('listitem')
    .find((item) => within(item).queryByRole('switch', { name }) !== null);

  if (row === undefined) {
    throw new Error(`No row holds ${name}.`);
  }

  return row;
};

beforeEach(() => {
  requesting.isEnabled = false;
  requesting.kinds = ['film'];
});

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

  it('turns every other permission on and shuts it while Everything is on, and says why', () => {
    drawKnowing({
      catalogue: ['administrator', 'jobs.run', 'jobs.runDestructive', 'sharing.link'],
      pluginNodes: NODES,
      selected: ['administrator'],
    });

    const everything = screen.getByRole('switch', { name: 'Everything' });

    expect(everything).toBeChecked();
    expect(everything).toBeEnabled();

    for (const name of [
      'Run and schedule jobs',
      'Reset and rebuild',
      'Create share links',
      'Sync lists',
      'Import playlists',
    ]) {
      expect(screen.getByRole('switch', { name })).toBeChecked();
      expect(screen.getByRole('switch', { name })).toBeDisabled();
    }

    expect(
      screen.getByText('Everything is on, so every permission below is included.'),
    ).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    expect(screen.getAllByText('1 of 1')).toHaveLength(3);
  });

  it('says nothing about Everything while it is off', () => {
    drawKnowing({ catalogue: ['administrator', 'jobs.run'], selected: ['jobs.run'] });

    expect(screen.getByRole('switch', { name: 'Everything' })).not.toBeChecked();
    expect(screen.getByRole('switch', { name: 'Run and schedule jobs' })).toBeEnabled();
    expect(screen.queryByText(/Everything is on/)).not.toBeInTheDocument();
  });

  it('turns Everything off when it is switched', async () => {
    const onToggle = vi.fn();

    drawKnowing({
      catalogue: ['administrator', 'jobs.run'],
      selected: ['administrator'],
      onToggle,
    });

    await userEvent.click(screen.getByRole('switch', { name: 'Everything' }));

    expect(onToggle).toHaveBeenCalledWith('administrator');
  });

  it('shuts a permission the reader does not hold, and says why', () => {
    drawKnowing(
      { catalogue: ['jobs.run', 'jobs.runDestructive', 'server.settings'], selected: [] },
      { mine: { permissions: ['jobs.run'], isAdministrator: false } },
    );

    expect(screen.getByRole('switch', { name: 'Reset and rebuild' })).toBeDisabled();
    expect(rowOf('Reset and rebuild')).toHaveTextContent(
      'You don’t have this permission, so you can’t give it.',
    );
    expect(screen.getByRole('switch', { name: 'Change server settings' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Run and schedule jobs' })).toBeEnabled();
    expect(rowOf('Run and schedule jobs')).not.toHaveTextContent(/You don’t have this permission/);
  });

  it('lets a permission the role holds be taken away, though the reader does not hold it', () => {
    drawKnowing(
      { catalogue: ['jobs.run', 'server.settings'], selected: ['server.settings'] },
      { mine: { permissions: ['jobs.run'], isAdministrator: false } },
    );

    expect(screen.getByRole('switch', { name: 'Change server settings' })).toBeEnabled();
    expect(rowOf('Change server settings')).not.toHaveTextContent(/You don’t have this permission/);
  });

  it('shuts nothing for a reader who administers the server', () => {
    drawKnowing({ catalogue: ['jobs.run', 'jobs.runDestructive'], selected: [] });

    expect(screen.getByRole('switch', { name: 'Reset and rebuild' })).toBeEnabled();
    expect(screen.queryByText(/You don’t have this permission/)).not.toBeInTheDocument();
  });

  it('offers watching films not on the server once a source and requests exist', () => {
    drawKnowing(
      { catalogue: ['requests.ask', 'sources.play'], selected: [] },
      { contributions: somePluginContributions({ sources: [A_SOURCE] }) },
    );

    expect(
      screen.getByRole('switch', { name: 'Watch films not on the server' }),
    ).toBeInTheDocument();
  });

  it('hides watching films not on the server where no plugin offers a source', () => {
    drawKnowing({ catalogue: ['requests.ask', 'sources.play'], selected: [] });

    expect(screen.getByRole('switch', { name: 'Request films and series' })).toBeInTheDocument();
    expect(
      screen.queryByRole('switch', { name: 'Watch films not on the server' }),
    ).not.toBeInTheDocument();
  });

  it('hides watching films not on the server where nothing can be requested', () => {
    drawKnowing(
      { catalogue: ['jobs.run', 'sources.play'], selected: [] },
      { contributions: somePluginContributions({ sources: [A_SOURCE] }) },
    );

    expect(
      screen.queryByRole('switch', { name: 'Watch films not on the server' }),
    ).not.toBeInTheDocument();
  });

  it('lays each group out as a card counting what is held, admin ones under a heading', () => {
    drawKnowing({
      catalogue: [
        'download.media',
        'sharing.link',
        'jobs.run',
        'jobs.runDestructive',
        'server.settings',
      ],
      selected: ['jobs.run', 'download.media'],
    });

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Watching',
      'Sharing',
      'Admin permissions',
      'Jobs',
      'Server',
    ]);
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(screen.getByText('1 of 1')).toBeInTheDocument();
    expect(screen.getAllByText('0 of 1')).toHaveLength(2);
  });

  it('draws no admin heading where no admin permission is offered', () => {
    drawKnowing({ catalogue: ['download.media', 'sharing.link'], selected: [] });

    expect(screen.queryByRole('heading', { name: 'Admin permissions' })).not.toBeInTheDocument();
  });

  it('is told which permission was switched', async () => {
    const onToggle = vi.fn();

    drawKnowing({ catalogue: ['jobs.run'], selected: [], onToggle });

    await userEvent.click(screen.getByRole('switch', { name: 'Run and schedule jobs' }));

    expect(onToggle).toHaveBeenCalledWith('jobs.run');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(PermissionEditor.displayName).toBe('PermissionEditor');
  });
});
