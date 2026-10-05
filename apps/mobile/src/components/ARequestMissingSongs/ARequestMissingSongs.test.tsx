import { Alert } from 'react-native';
import { fireEvent, render, userEvent, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { findMissingAlbums } from '@ValenceClient/requests/fetchAskable';
import { askForMedia } from '@ValenceClient/requests/fetchMediaRequests';
import { fetchProfilesOnOffer } from '@ValenceClient/requests/fetchProfiles';
import { ARequestMissingSongs } from './ARequestMissingSongs';
import type { CatalogueTitle } from '@ValenceContracts/schemas/CatalogueTitle';
import type { MissingAlbum } from '@ValenceContracts/schemas/MissingAlbums';

jest.mock('@ValenceClient/requests/fetchAskable');
jest.mock('@ValenceClient/requests/fetchMediaRequests');
jest.mock('@ValenceClient/requests/fetchProfiles');

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
const LOSSLESS = '00000000-0000-4000-8000-0000000000a1';

const alerted = jest.fn();

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

beforeEach(() => {
  jest.clearAllMocks();
  installPlatform(aFakePlatform());
  jest.mocked(findMissingAlbums).mockResolvedValue({ isMatching: false, albums: MATCHED });
  jest.mocked(askForMedia).mockResolvedValue({
    value: aMediaRequest({ kind: 'album', tmdbId: null }),
    refusal: { message: '' },
  });
  jest.mocked(fetchProfilesOnOffer).mockResolvedValue({ choices: [], forcedId: null });
  jest.spyOn(Alert, 'alert').mockImplementation(alerted);
});

describe('ARequestMissingSongs', () => {
  it('lists each album the server found, switching on those that can be requested, and requests them', async () => {
    const onClose = jest.fn();
    const onRequested = jest.fn();
    const drawn = await render(
      <ARequestMissingSongs
        playlistId={PLAYLIST_ID}
        isOpen
        onClose={onClose}
        onRequested={onRequested}
      />,
      { wrapper: CacheScope },
    );

    expect(await drawn.findByText('Mara Quill · 2 songs')).toBeTruthy();
    expect(drawn.getByText('Not found')).toBeTruthy();
    expect(drawn.getByRole('switch', { name: 'Request Coastal', checked: true })).toBeTruthy();
    expect(drawn.queryByRole('switch', { name: 'Request Kept' })).toBeNull();
    expect(findMissingAlbums).toHaveBeenCalledWith(PLAYLIST_ID);

    await userEvent.press(drawn.getByText('Request 2 albums'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(jest.mocked(askForMedia).mock.calls.map(([asked]) => asked)).toEqual([
      { kind: 'album', musicBrainzId: COASTAL.id },
      { kind: 'album', musicBrainzId: INLAND.id },
    ]);
    expect(onRequested).toHaveBeenCalled();
    expect(alerted).toHaveBeenCalledWith('2 albums requested', expect.stringContaining('Search'));
  });

  it('will not request anything while the server is still looking', async () => {
    jest.mocked(findMissingAlbums).mockResolvedValue({
      isMatching: true,
      albums: [row('Coastal', COASTAL, 2), row('Inland', null, 1, false)],
    });

    const drawn = await render(
      <ARequestMissingSongs
        playlistId={PLAYLIST_ID}
        isOpen
        onClose={jest.fn()}
        onRequested={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    expect(
      await drawn.findByText('Still looking for 1 album. You can close this and come back to it.'),
    ).toBeTruthy();

    await userEvent.press(drawn.getByText('Request 1 album'));

    expect(askForMedia).not.toHaveBeenCalled();
  });

  it('leaves out an album switched off, and requests the rest at the quality chosen', async () => {
    jest.mocked(fetchProfilesOnOffer).mockResolvedValue({
      choices: [
        { id: LOSSLESS, name: 'Lossless', kind: 'music' },
        { id: '00000000-0000-4000-8000-0000000000a2', name: 'Small', kind: 'music' },
      ],
      forcedId: null,
    });

    const drawn = await render(
      <ARequestMissingSongs
        playlistId={PLAYLIST_ID}
        isOpen
        onClose={jest.fn()}
        onRequested={jest.fn()}
      />,
      { wrapper: CacheScope },
    );

    await fireEvent(
      await drawn.findByRole('switch', { name: 'Request Inland' }),
      'valueChange',
      false,
    );
    await userEvent.press(await drawn.findByText('Lossless'));
    await userEvent.press(drawn.getByText('Request 1 album'));

    await waitFor(() => {
      expect(askForMedia).toHaveBeenCalledWith({
        kind: 'album',
        musicBrainzId: COASTAL.id,
        profileId: LOSSLESS,
      });
    });
    expect(askForMedia).toHaveBeenCalledTimes(1);
  });
});
