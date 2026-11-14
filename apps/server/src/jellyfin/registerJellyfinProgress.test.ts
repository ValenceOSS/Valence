import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { showJellyfinId } from './showJellyfinId';
import { aJellyfinServer } from './testing/aJellyfinServer';

const PlaybackSchema = z.object({
  PlaySessionId: z.string(),
  MediaSources: z.array(
    z.object({
      SupportsDirectPlay: z.boolean(),
      TranscodingUrl: z.string().optional(),
      DirectStreamUrl: z.string().optional(),
    }),
  ),
});

describe('registerJellyfinProgress', () => {
  it('write where playback got to, and stop the session when it stops', async () => {
    const { post, film, recorded } = aJellyfinServer();
    const id = film.id.replaceAll('-', '');
    const info = PlaybackSchema.parse(
      await (await post(`/Items/${id}/PlaybackInfo`, { DeviceProfile: null })).json(),
    );

    await post('/Sessions/Playing', {
      ItemId: id,
      PlaySessionId: info.PlaySessionId,
      PositionTicks: 0,
    });
    await post('/Sessions/Playing/Progress', {
      ItemId: id,
      PlaySessionId: info.PlaySessionId,
      PositionTicks: 1_000_000_000,
    });
    await post('/Sessions/Playing/Stopped', {
      ItemId: id,
      PlaySessionId: info.PlaySessionId,
      PositionTicks: 1_200_000_000,
    });

    expect(recorded.progress.map((one) => one.positionSeconds)).toEqual([0, 100, 120]);
    expect(recorded.stopped).toEqual(['session-1']);
  });

  it('mark something watched and not watched, and keep it as a favourite', async () => {
    const { ask, film, recorded } = aJellyfinServer();
    const id = film.id.replaceAll('-', '');

    const played = await (await ask(`/Users/x/PlayedItems/${id}`, { method: 'POST' })).json();

    expect(played).toMatchObject({ Played: true });
    await ask(`/UserPlayedItems/${id}`, { method: 'DELETE' });
    await ask(`/UserFavoriteItems/${id}`, { method: 'POST' });

    expect(recorded.progress).toEqual([
      { mediaId: film.id, positionSeconds: 7560, durationSeconds: 7560 },
    ]);
    expect(recorded.forgotten).toEqual([film.id]);
    expect(recorded.favourites).toEqual([{ mediaId: film.id, isFavourite: true }]);
  });

  it('mark every episode of a programme watched at once', async () => {
    const { ask, show, recorded } = aJellyfinServer();

    await ask('/Items?IncludeItemTypes=Series&Recursive=true');
    await ask(`/UserPlayedItems/${showJellyfinId(show.libraryId, show.id)}`, { method: 'POST' });

    expect(recorded.progress).toHaveLength(2);
  });
});
