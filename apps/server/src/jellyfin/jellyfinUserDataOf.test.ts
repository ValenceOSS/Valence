import { describe, expect, it } from 'vitest';
import { jellyfinUserDataOf } from './jellyfinUserDataOf';

const ID = '0f8fad5b-d9cb-469f-a165-70867728950e';

const viewing = (isFinished: boolean | null, isFavourite = false) => ({
  serverId: 's',
  progress: new Map(
    isFinished === null
      ? []
      : [
          [
            ID,
            {
              mediaId: ID,
              positionSeconds: 30,
              durationSeconds: 120,
              isFinished,
              updatedAt: '2026-11-14T00:00:00.000Z',
            },
          ],
        ],
  ),
  favourites: new Set(isFavourite ? [ID] : []),
});

describe('jellyfinUserDataOf', () => {
  it('says nothing was watched where nothing was', () => {
    expect(jellyfinUserDataOf(ID, viewing(null, true))).toEqual({
      PlaybackPositionTicks: 0,
      PlayCount: 0,
      IsFavorite: true,
      Played: false,
      Key: '0f8fad5bd9cb469fa16570867728950e',
      ItemId: '0f8fad5bd9cb469fa16570867728950e',
    });
  });

  it('says how far somebody got', () => {
    expect(jellyfinUserDataOf(ID, viewing(false))).toMatchObject({
      PlaybackPositionTicks: 300_000_000,
      PlayedPercentage: 25,
      Played: false,
      LastPlayedDate: '2026-11-14T00:00:00.000Z',
    });
  });

  it('says something finished was played, with no place to resume from', () => {
    expect(jellyfinUserDataOf(ID, viewing(true))).toMatchObject({
      PlaybackPositionTicks: 0,
      PlayCount: 1,
      Played: true,
    });
  });
});
