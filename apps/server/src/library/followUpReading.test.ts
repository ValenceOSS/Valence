import { describe, expect, it, vi } from 'vitest';
import { followUpReading } from './followUpReading';

const aLibrary = () => {
  const asked: string[] = [];
  const step = (name: string) =>
    vi.fn((): Promise<undefined> => {
      asked.push(name);

      return Promise.resolve(undefined);
    });

  return {
    asked,
    work: {
      fetchLogos: step('logos'),
      detectSegments: step('segments'),
      regeneratePreviews: step('previews'),
      regenerateTrickplay: step('trickplay'),
    },
  };
};

describe('followUpReading', () => {
  it('fetches lettering, then previews and scrubbing thumbnails, for films', async () => {
    const { asked, work } = aLibrary();

    await followUpReading(work, 'films', 'movies');

    expect(asked).toEqual(['logos', 'previews', 'trickplay']);
    expect(work.fetchLogos).toHaveBeenCalledWith('films');
  });

  it('also looks for intros and credits in a library of programmes', async () => {
    const { asked, work } = aLibrary();

    await followUpReading(work, 'shows', 'shows');

    expect(asked).toEqual(['logos', 'segments', 'previews', 'trickplay']);
  });

  it('looks for intros and credits in a library of anime too', async () => {
    const { asked, work } = aLibrary();

    await followUpReading(work, 'anime', 'anime');

    expect(asked).toEqual(['logos', 'segments', 'previews', 'trickplay']);
  });

  it('does nothing for music', async () => {
    const { asked, work } = aLibrary();

    await followUpReading(work, 'songs', 'music');

    expect(asked).toEqual([]);
  });
});
