import { describe, expect, it } from 'vitest';
import { airDateOf } from './airDateOf';
import { parseEpisodePath } from './parseEpisodePath';

describe('airDateOf', () => {
  it('writes the day an episode named by its air date aired as the catalogue does', () => {
    expect(airDateOf(parseEpisodePath('/tv/Some Show/Some Show 2024-03-05.mkv'))).toBe(
      '2024-03-05',
    );
    expect(airDateOf(parseEpisodePath('/tv/Some Show/Some.Show.2024.03.05.mkv'))).toBe(
      '2024-03-05',
    );
  });

  it('says nothing of an episode named by its number', () => {
    expect(airDateOf(parseEpisodePath('/tv/Some Show/Some Show S01E02.mkv'))).toBeNull();
  });
});
