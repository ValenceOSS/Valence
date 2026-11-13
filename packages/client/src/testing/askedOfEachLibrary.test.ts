import { describe, expect, it, vi } from 'vitest';
import { askedOfEachLibrary } from './askedOfEachLibrary';

describe('askedOfEachLibrary', () => {
  it('asks each library the same question and answers with everything they found', async () => {
    const ofOne = vi.fn((libraryId: string, options: { limit: number }) =>
      Promise.resolve({ items: [`${libraryId}:${options.limit.toString()}`], total: 3 }),
    );

    await expect(askedOfEachLibrary(ofOne)(['films', 'shows'], { limit: 2 })).resolves.toEqual({
      items: ['films:2', 'shows:2'],
      total: 6,
    });
    expect(ofOne).toHaveBeenCalledWith('films', { limit: 2 });
    expect(ofOne).toHaveBeenCalledWith('shows', { limit: 2 });
  });
});
