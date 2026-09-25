import { describe, expect, it } from 'vitest';
import { resolveSeriesName } from './resolveSeriesName';

const NAMES: [string, string][] = [
  ['The.Show.S01', 'The Show'],
  ['The.Show.S01.COMPLETE', 'The Show'],
  ['S.H.O.W.S01', 'S.H.O.W'],
  ['The.Show.P.I.S01', 'The Show P.I'],
  ['The_Show_Season_1', 'The Show'],
  ['/something/The_Show/Season 10', 'The Show'],
  ['The Show', 'The Show'],
  ['/some/path/The Show', 'The Show'],
  ['/some/path/The Show s02e10 720p hdtv', 'The Show'],
  ['/some/path/The Show s02e10 the episode 720p hdtv', 'The Show'],
  ['/some/path/1923 (2022)', '1923'],
  ["/some/path/Marvel's Agents of S.H.I.E.L.D.", "Marvel's Agents of S.H.I.E.L.D."],
  ["Marvel's.Agents.of.S.H.I.E.L.D.", "Marvel's Agents of S.H.I.E.L.D."],
  ['The.Show.S.H.O.W', 'The Show S.H.O.W'],
  ["/some/path/Dawson's Creek", "Dawson's Creek"],
];

describe('resolveSeriesName', () => {
  it.each(NAMES)('names %j %j', (path, name) => {
    expect(resolveSeriesName(path).name).toBe(name);
  });

  it('reads the year a folder gives beside the name', () => {
    expect(resolveSeriesName('/tv/Doctor Who (2005)')).toEqual({ name: 'Doctor Who', year: 2005 });
  });
});
