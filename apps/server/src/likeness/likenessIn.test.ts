import { describe, expect, it } from 'vitest';
import { CAST_COMPARED, likenessIn } from './likenessIn';

describe('reading what makes a title like another', () => {
  it('reads a film, whose keywords come under keywords', () => {
    expect(
      likenessIn({
        genres: [{ id: 878, name: 'Science Fiction' }],
        keywords: { keywords: [{ id: 9663 }, { id: 4565 }] },
        recommendations: { results: [{ id: 603 }, { id: 604 }] },
        credits: {
          cast: [{ id: 6384 }, { id: 2975 }],
          crew: [
            { id: 9339, job: 'Director' },
            { id: 9340, job: 'Screenplay' },
            { id: 1, job: 'Producer' },
          ],
        },
      }),
    ).toEqual({
      genres: [878],
      keywords: [9663, 4565],
      cast: [6384, 2975],
      crew: [9339, 9340],
      recommendations: [603, 604],
    });
  });

  it('reads a programme, whose keywords come under results and whose makers created it', () => {
    expect(
      likenessIn({
        keywords: { results: [{ id: 818 }] },
        created_by: [{ id: 66633 }],
        credits: { cast: [], crew: [{ id: 66633, job: 'Writer' }] },
      }),
    ).toEqual({ genres: [], keywords: [818], cast: [], crew: [66633], recommendations: [] });
  });

  it('keeps only the top of the bill', () => {
    const cast = Array.from({ length: CAST_COMPARED + 5 }, (_, at) => ({ id: at + 1 }));

    expect(likenessIn({ credits: { cast, crew: [] } })?.cast).toHaveLength(CAST_COMPARED);
  });

  it('leaves out entries without an identifier, and names each once', () => {
    expect(
      likenessIn({
        credits: { cast: [{ id: null }, { id: 5 }, { id: 5 }], crew: [] },
      })?.cast,
    ).toEqual([5]);
  });

  it('reads a record that appended nothing as alike to nothing', () => {
    expect(likenessIn({ id: 1 })).toEqual({
      genres: [],
      keywords: [],
      cast: [],
      crew: [],
      recommendations: [],
    });
  });

  it('reads a part that is not shaped as expected as empty rather than failing', () => {
    expect(likenessIn({ keywords: 'none', recommendations: { results: 'none' } })).toEqual({
      genres: [],
      keywords: [],
      cast: [],
      crew: [],
      recommendations: [],
    });
  });

  it('says nothing for an answer that is not a record', () => {
    expect(likenessIn(null)).toBeNull();
  });
});
