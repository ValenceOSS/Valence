import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { RequestMissingSongsDialog } from './RequestMissingSongsDialog';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MissingAlbum } from '@ValenceContracts/schemas/MissingAlbums';

const PLAYLIST_ID = '00000000-0000-4000-8000-00000000d0d0';

const anAlbum = (id: string, title: string, status: 'askable' | 'library'): CatalogueTitle => ({
  kind: 'album',
  id,
  title,
  subtitle: 'Mara Quill',
  year: 2024,
  overview: null,
  posterUrl: null,
  standing: {
    status,
    mediaId: status === 'library' ? 'm1' : null,
    requestId: null,
    requestState: null,
  },
});

const COASTAL = anAlbum('00000000-0000-4000-8000-00000000c0a5', 'Coastal', 'askable');
const INLAND = anAlbum('00000000-0000-4000-8000-0000000017a1', 'Inland', 'askable');

const row = (
  title: string,
  found: CatalogueTitle | null,
  songCount = 1,
  isMatched = true,
): MissingAlbum => ({
  key: title,
  title,
  artist: 'Mara Quill',
  coverUrl: null,
  songCount,
  isMatched,
  found,
});

const MATCHED = [
  row('Coastal', COASTAL, 2),
  row('Inland', INLAND),
  row('Kept', anAlbum('00000000-0000-4000-8000-00000000ce97', 'Kept', 'library')),
  row('Unknown', null),
];

/**
 * Answers the dialog: the server's search for the albums, the qualities on offer, and asking.
 */
const answering = (
  albums: { isMatching: boolean; albums: MissingAlbum[] },
  choices: { id: string; name: string; kind: 'music' }[] = [],
) => {
  const asked: JsonValue[] = [];
  const fetched = vi.fn((input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const answer = url.startsWith(`/api/requests/missing-albums/${PLAYLIST_ID}`)
      ? albums
      : url.startsWith('/api/requests/profiles?kind=album')
        ? { choices, forcedId: null }
        : url === '/api/requests/media'
          ? aMediaRequest({ kind: 'album', tmdbId: null })
          : null;

    if (url === '/api/requests/media' && typeof init?.body === 'string') {
      asked.push(JsonValueSchema.parse(JSON.parse(init.body)));
    }

    return Promise.resolve(
      answer === null
        ? Response.json({ error: 'Not here.' }, { status: 404 })
        : Response.json(answer),
    );
  });

  vi.stubGlobal('fetch', fetched);

  return { fetched, asked };
};

describe('RequestMissingSongsDialog', () => {
  it('lists each album the server found, ticking those that can be requested, and requests them', async () => {
    const { fetched, asked } = answering({ isMatching: false, albums: MATCHED });
    const onClose = vi.fn();

    renderInAnAddress(
      <RequestMissingSongsDialog
        playlistId={PLAYLIST_ID}
        name="Evening"
        isOpen
        onClose={onClose}
      />,
    );

    expect(await screen.findByText('Mara Quill · 2 songs')).toBeInTheDocument();
    expect(screen.getByText('Not found')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Request Coastal' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Request Inland' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Request Kept' })).not.toBeInTheDocument();
    expect(fetched).toHaveBeenCalledWith(
      `/api/requests/missing-albums/${PLAYLIST_ID}`,
      expect.objectContaining({ method: 'POST' }),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Request 2 albums' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledOnce();
    });
    expect(asked).toEqual([
      { kind: 'album', musicBrainzId: COASTAL.id },
      { kind: 'album', musicBrainzId: INLAND.id },
    ]);
  });

  it('will not request anything while the server is still looking', async () => {
    answering({
      isMatching: true,
      albums: [row('Coastal', COASTAL, 2), row('Inland', null, 1, false)],
    });

    renderInAnAddress(
      <RequestMissingSongsDialog
        playlistId={PLAYLIST_ID}
        name="Evening"
        isOpen
        onClose={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('Still looking for 1 album. You can close this and come back to it.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Request 1 album' })).toBeDisabled();
  });

  it('leaves out an album unticked, and asks once which quality to request the rest at', async () => {
    const { asked } = answering({ isMatching: false, albums: MATCHED }, [
      { id: '00000000-0000-4000-8000-0000000000a1', name: 'Lossless', kind: 'music' },
      { id: '00000000-0000-4000-8000-0000000000a2', name: 'Small', kind: 'music' },
    ]);

    renderInAnAddress(
      <RequestMissingSongsDialog
        playlistId={PLAYLIST_ID}
        name="Evening"
        isOpen
        onClose={vi.fn()}
      />,
    );

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Request Inland' }));
    await userEvent.click(screen.getByRole('button', { name: 'Request 1 album' }));
    await userEvent.click(await screen.findByRole('button', { name: /Lossless/u }));

    await waitFor(() => {
      expect(asked).toEqual([
        {
          kind: 'album',
          musicBrainzId: COASTAL.id,
          profileId: '00000000-0000-4000-8000-0000000000a1',
        },
      ]);
    });
  });
});
