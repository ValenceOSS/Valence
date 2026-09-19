import { describe, expect, it } from 'vitest';
import { describeAskableFacts } from './describeAskableFacts';

describe('describeAskableFacts', () => {
  it('says the year, the running time and the first few genres', () => {
    expect(
      describeAskableFacts({
        subtitle: null,
        year: 2021,
        runtimeMinutes: 155,
        genres: ['Science Fiction', 'Drama', 'Adventure', 'War'],
      }),
    ).toBe('2021 · 2 h 35 min · Science Fiction, Drama, Adventure');
    expect(
      describeAskableFacts({ subtitle: null, year: null, runtimeMinutes: 120, genres: [] }),
    ).toBe('2 h');
    expect(
      describeAskableFacts({ subtitle: null, year: null, runtimeMinutes: 42, genres: [] }),
    ).toBe('42 min');
  });

  it('says who an album is by, and nothing where nothing is known', () => {
    expect(
      describeAskableFacts({
        subtitle: 'Pink Floyd',
        year: 1979,
        runtimeMinutes: null,
        genres: [],
      }),
    ).toBe('Pink Floyd · 1979');
    expect(
      describeAskableFacts({ subtitle: null, year: null, runtimeMinutes: null, genres: [] }),
    ).toBe('');
  });
});
