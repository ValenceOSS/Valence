import { beforeEach, describe, expect, it, vi } from 'vitest';
import { askForEveryAlbum } from './askForEveryAlbum';
import type { MediaRequestAsk } from '@ValenceContracts/schemas/MediaRequest';

const askForMedia = vi.hoisted(() =>
  vi.fn((asked: MediaRequestAsk) =>
    Promise.resolve(
      asked.musicBrainzId === 'b'
        ? { value: null, refusal: { message: 'No.' } }
        : { value: { id: asked.musicBrainzId }, refusal: { message: '' } },
    ),
  ),
);

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({ askForMedia }));

beforeEach(() => {
  askForMedia.mockClear();
});

describe('askForEveryAlbum', () => {
  it('asks for each album once, at the quality chosen, counting what was refused', async () => {
    expect(await askForEveryAlbum(['a', 'b', 'a', 'c'], 'profile-1')).toEqual({
      asked: 2,
      refused: 1,
    });
    expect(askForMedia.mock.calls.map(([asked]) => asked)).toEqual([
      { kind: 'album', musicBrainzId: 'a', profileId: 'profile-1' },
      { kind: 'album', musicBrainzId: 'b', profileId: 'profile-1' },
      { kind: 'album', musicBrainzId: 'c', profileId: 'profile-1' },
    ]);
  });

  it('leaves the quality to the library where none was chosen', async () => {
    await askForEveryAlbum(['a'], null);

    expect(askForMedia).toHaveBeenCalledWith({ kind: 'album', musicBrainzId: 'a' });
  });
});
