import { describe, expect, it } from 'vitest';
import { summariseArrivals } from './summariseArrivals';
import type { ArrivedItem } from './summariseArrivals';

const episode = (seriesTitle: string, title: string): ArrivedItem => ({ title, seriesTitle });

const film = (title: string): ArrivedItem => ({ title, seriesTitle: null });

describe('summariseArrivals', () => {
  it('names a programme once and counts what arrived of it', () => {
    const summary = summariseArrivals(
      [episode('24', '12:00 A.M.-1:00 A.M.'), episode('24', '1:00 A.M.-2:00 A.M.')],
      25,
    );

    expect(summary.listed).toEqual([{ title: '24', episodes: 2 }]);
  });

  it('leaves a film under its own name', () => {
    expect(summariseArrivals([film('Brazil')], 25).listed).toEqual([
      { title: 'Brazil', episodes: 1 },
    ]);
  });

  it('keeps one programme apart from another', () => {
    const summary = summariseArrivals(
      [episode('24', 'one'), episode('The Thick Of It', 'two'), episode('24', 'three')],
      25,
    );

    expect(summary.listed).toEqual([
      { title: '24', episodes: 2 },
      { title: 'The Thick Of It', episodes: 1 },
    ]);
  });

  it('puts the fullest titles first, so what is cut is the least of it', () => {
    const summary = summariseArrivals(
      [film('Brazil'), episode('24', 'one'), episode('24', 'two'), episode('24', 'three')],
      25,
    );

    expect(summary.listed.map((one) => one.title)).toEqual(['24', 'Brazil']);
  });

  it('settles a tie by name, so the same scan reads the same way twice', () => {
    const summary = summariseArrivals([film('Zulu'), film('Alien'), film('Metropolis')], 25);

    expect(summary.listed.map((one) => one.title)).toEqual(['Alien', 'Metropolis', 'Zulu']);
  });

  it('counts the titles it had no room for, not the episodes', () => {
    const summary = summariseArrivals(
      [
        ...Array.from({ length: 40 }, (_unused, at) => episode('24', `episode ${at.toString()}`)),
        film('Brazil'),
        film('Alien'),
      ],
      2,
    );

    expect(summary.listed).toEqual([
      { title: '24', episodes: 40 },
      { title: 'Alien', episodes: 1 },
    ]);
    expect(summary.notListed).toBe(1);
  });

  it('has nothing to say about a scan that brought nothing in', () => {
    expect(summariseArrivals([], 25)).toEqual({ listed: [], notListed: 0 });
  });

  it('names an episode by its own title where the scan could not say what it belongs to', () => {
    expect(summariseArrivals([episode('', 'A stray')], 25).listed).toEqual([
      { title: 'A stray', episodes: 1 },
    ]);
  });
});
