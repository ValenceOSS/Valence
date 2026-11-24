import { mixItem } from '@ValenceTv/music/mixItem';
import type { MusicMixSummary } from '@ValenceContracts/schemas/MusicMix';

const COVER = '00000000-0000-4000-8000-000000000009';

const MIX: MusicMixSummary = {
  id: 'daily-1',
  kind: 'daily',
  title: 'Daily Mix 1',
  detail: 'Sleep Token, Bring Me the Horizon and more',
  trackCount: 50,
  coverAlbumIds: [COVER],
  faces: [],
};

describe('mixItem', () => {
  it('shows the first album in it as its cover, and what it is made of', () => {
    expect(mixItem(MIX)).toEqual({
      kind: 'mix',
      id: 'daily-1',
      title: 'Daily Mix 1',
      detail: 'Sleep Token, Bring Me the Horizon and more',
      art: `/api/music/albums/${COVER}/artwork`,
      view: { kind: 'mix', id: 'daily-1' },
    });
  });

  it('has no picture where it has no albums to show', () => {
    expect(mixItem({ ...MIX, coverAlbumIds: [] }).art).toBeNull();
  });
});
