import { MediaSummarySchema } from '@ValenceContracts/schemas/Library';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { whatAResultOpens } from './whatAResultOpens';

const aResult = (extra: Partial<MediaSummary> = {}) =>
  MediaSummarySchema.parse({
    id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
    title: 'Arrival',
    year: 2016,
    durationSeconds: 6960,
    width: 1920,
    height: 1080,
    videoCodec: 'hevc',
    videoRange: 'SDR',
    addedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  });

describe('whatAResultOpens', () => {
  it('opens a film as itself', () => {
    expect(whatAResultOpens(aResult())).toEqual({
      kind: 'title',
      mediaId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    });
  });

  it('opens an episode as its programme, since that is what was searched for', () => {
    expect(whatAResultOpens(aResult({ seriesId: '3fa85f64-5717-4562-b3fc-2c963f66afa9' }))).toEqual(
      {
        kind: 'programme',
        libraryId: '3fa85f64-5717-4562-b3fc-2c963f66afa7',
        showId: '3fa85f64-5717-4562-b3fc-2c963f66afa9',
      },
    );
  });

  it('finds the programme by its name where that is all the library knows', () => {
    expect(whatAResultOpens(aResult({ seriesTitle: 'Severance' }))).toMatchObject({
      kind: 'programme',
      showId: 'severance',
    });
  });

  it('prefers the series the library knows over a name it had to guess from', () => {
    expect(
      whatAResultOpens(
        aResult({ seriesId: '3fa85f64-5717-4562-b3fc-2c963f66afa9', seriesTitle: 'Severance' }),
      ),
    ).toMatchObject({ showId: '3fa85f64-5717-4562-b3fc-2c963f66afa9' });
  });

  it('opens something whose series name is blank as itself', () => {
    expect(whatAResultOpens(aResult({ seriesTitle: '' }))).toMatchObject({ kind: 'title' });
  });
});
