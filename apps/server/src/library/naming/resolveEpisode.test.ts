import { describe, expect, it } from 'vitest';
import { resolveEpisode } from './resolveEpisode';

const ABSOLUTE: [string, number][] = [
  ['The Simpsons/12.avi', 12],
  ['The Simpsons/The Simpsons 12.avi', 12],
  ['The Simpsons/The Simpsons 82.avi', 82],
  ['The Simpsons/The Simpsons 112.avi', 112],
  ['The Simpsons/Foo_ep_02.avi', 2],
  ['The Simpsons/The Simpsons 889.avi', 889],
  ['The Simpsons/The Simpsons 101.avi', 101],
];

const DAILY: [string, string, number | null, number | null, number | null][] = [
  ['/server/anything_1996.11.14.mp4', 'anything', 1996, 11, 14],
  ['/server/anything_1996-11-14.mp4', 'anything', 1996, 11, 14],
  [
    '/server/james.corden.2017.04.20.anne.hathaway.720p.hdtv.x264-crooks.mkv',
    'james.corden',
    2017,
    4,
    20,
  ],
  ['/server/ABC News 2018_03_24_19_00_00.mkv', 'ABC News', 2018, 3, 24],
  ['/server/Jeopardy 2023 07 14 HDTV x264 AC3.mkv', 'Jeopardy', 2023, 7, 14],
];

const WITHOUT_SEASONS: [number, string][] = [
  [8, 'The Simpsons/The Simpsons.S25E08.Steal this episode.mp4'],
  [2, 'The Simpsons/The Simpsons - 02 - Ep Name.avi'],
  [2, 'The Simpsons/02.avi'],
  [2, 'The Simpsons/02 - Ep Name.avi'],
  [2, 'The Simpsons/02-Ep Name.avi'],
  [2, 'The Simpsons/02.EpName.avi'],
  [2, 'The Simpsons/The Simpsons - 02.avi'],
  [2, 'The Simpsons/The Simpsons - 02 Ep Name.avi'],
  [7, 'GJ Club (2013)/GJ Club - 07.mkv'],
  [317, 'Case Closed (1996-2007)/Case Closed - 317.mkv'],
];

const SEASONS: [string, number | null][] = [
  ['The Daily Show/The Daily Show 25x22 - [WEBDL-720p][AAC 2.0][x264] Noah Baumbach-TBS.mkv', 25],
  ['/Show/Season 02/S02E03 blah.avi', 2],
  ['Season 1/seriesname S01x02 blah.avi', 1],
  ['Season 1/S01x02 blah.avi', 1],
  ['Season 1/seriesname S01xE02 blah.avi', 1],
  ['Season 1/01x02 blah.avi', 1],
  ['Season 1/S01E02 blah.avi', 1],
  ['Season 1/S01xE02 blah.avi', 1],
  ['Season 1/seriesname 01x02 blah.avi', 1],
  ['Season 1/seriesname S01E02 blah.avi', 1],
  ['Season 2/Elementary - 02x03 - 02x04 - 02x15 - Ep Name.mp4', 2],
  ['Season 2/02x03 - 02x04 - 02x15 - Ep Name.mp4', 2],
  ['Season 2/02x03-04-15 - Ep Name.mp4', 2],
  ['Season 2/Elementary - 02x03-04-15 - Ep Name.mp4', 2],
  ['Season 02/02x03-E15 - Ep Name.mp4', 2],
  ['Season 02/Elementary - 02x03-E15 - Ep Name.mp4', 2],
  ['Season 02/02x03 - x04 - x15 - Ep Name.mp4', 2],
  ['Season 02/Elementary - 02x03 - x04 - x15 - Ep Name.mp4', 2],
  ['Season 02/02x03x04x15 - Ep Name.mp4', 2],
  ['Season 02/Elementary - 02x03x04x15 - Ep Name.mp4', 2],
  ['Season 1/Elementary - S01E23-E24-E26 - The Woman.mp4', 1],
  ['Season 1/S01E23-E24-E26 - The Woman.mp4', 1],
  ['Season 25/The Simpsons.S25E09.Steal this episode.mp4', 25],
  ['The Simpsons/The Simpsons.S25E09.Steal this episode.mp4', 25],
  ['2016/Season s2016e1.mp4', 2016],
  ['2016/Season 2016x1.mp4', 2016],
  ['Season 2009/2009x02 blah.avi', 2009],
  ['Season 2009/S2009x02 blah.avi', 2009],
  ['Season 2009/S2009E02 blah.avi', 2009],
  ['Season 2009/S2009xE02 blah.avi', 2009],
  ['Season 2009/seriesname 2009x02 blah.avi', 2009],
  ['Season 2009/seriesname S2009x02 blah.avi', 2009],
  ['Season 2009/seriesname S2009E02 blah.avi', 2009],
  ['Season 2009/Elementary - 2009x03 - 2009x04 - 2009x15 - Ep Name.mp4', 2009],
  ['Season 2009/2009x03 - 2009x04 - 2009x15 - Ep Name.mp4', 2009],
  ['Season 2009/2009x03-04-15 - Ep Name.mp4', 2009],
  ['Season 2009/Elementary - 2009x03 - x04 - x15 - Ep Name.mp4', 2009],
  ['Season 2009/2009x03x04x15 - Ep Name.mp4', 2009],
  ['Season 2009/Elementary - 2009x03x04x15 - Ep Name.mp4', 2009],
  ['Season 2009/Elementary - S2009E23-E24-E26 - The Woman.mp4', 2009],
  ['Season 2009/S2009E23-E24-E26 - The Woman.mp4', 2009],
  ['Series/1-12 - The Woman.mp4', 1],
  ['Running Man/Running Man S2017E368.mkv', 2017],
  ['Case Closed (1996-2007)/Case Closed - 317.mkv', null],
];

const SIMPLE: [string, string, number | null, number | null, number | null][] = [
  ['/server/anything_s01e02.mp4', 'anything', 1, 2, null],
  ['/server/anything_s1e2.mp4', 'anything', 1, 2, null],
  ['/server/anything_s01.e02.mp4', 'anything', 1, 2, null],
  ['/server/anything_102.mp4', 'anything', 1, 2, null],
  ['/server/anything_1x02.mp4', 'anything', 1, 2, null],
  ['/server/The Walking Dead 4x01.mp4', 'The Walking Dead', 4, 1, null],
  ['/server/the_simpsons-s02e01_18536.mp4', 'the_simpsons', 2, 1, null],
  ['/server/Temp/S01E02 foo.mp4', '', 1, 2, null],
  ['Series/4x12 - The Woman.mp4', '', 4, 12, null],
  ['Series/LA X, Pt. 1_s06e32.mp4', 'LA X, Pt. 1', 6, 32, null],
  [
    '[Baz-Bar]Foo - [1080p][Multiple Subtitle]/[Baz-Bar] Foo - 05 [1080p][Multiple Subtitle].mkv',
    'Foo',
    null,
    5,
    null,
  ],
  [
    '/Foo/The.Series.Name.S01E04.WEBRip.x264-Baz[Bar]/the.series.name.s01e04.webrip.x264-Baz[Bar].mkv',
    'The.Series.Name',
    1,
    4,
    null,
  ],
  [
    'Love.Death.and.Robots.S01.1080p.NF.WEB-DL.DDP5.1.x264-NTG/Love.Death.and.Robots.S01E01.Sonnies.Edge.1080p.NF.WEB-DL.DDP5.1.x264-NTG.mkv',
    'Love.Death.and.Robots',
    1,
    1,
    null,
  ],
  [
    '[YuiSubs] Tensura Nikki - Tensei Shitara Slime Datta Ken/[YuiSubs] Tensura Nikki - Tensei Shitara Slime Datta Ken - 12 (NVENC H.265 1080p).mkv',
    'Tensura Nikki - Tensei Shitara Slime Datta Ken',
    null,
    12,
    null,
  ],
  [
    '[Baz-Bar]Foo - 01 - 12[1080p][Multiple Subtitle]/[Baz-Bar] Foo - 05 [1080p][Multiple Subtitle].mkv',
    'Foo',
    null,
    5,
    null,
  ],
  ['Series/4-12 - The Woman.mp4', '', 4, 12, 12],
];

describe('resolveEpisode', () => {
  it.each(ABSOLUTE)('reads %j as absolute episode %j', (path, episode) => {
    expect(resolveEpisode(path, { supportsAbsoluteNumbers: true })?.episodeNumber).toBe(episode);
  });

  it.each(DAILY)('reads %j as %j on %j-%j-%j', (path, name, year, month, day) => {
    const read = resolveEpisode(path);

    expect(read?.seasonNumber ?? null).toBeNull();
    expect(read?.episodeNumber ?? null).toBeNull();
    expect(read?.year ?? null).toBe(year);
    expect(read?.month ?? null).toBe(month);
    expect(read?.day ?? null).toBe(day);
    expect(read?.seriesName?.toLowerCase()).toBe(name.toLowerCase());
  });

  it.each(WITHOUT_SEASONS)('reads episode %j from %j', (episode, path) => {
    expect(resolveEpisode(path)?.episodeNumber).toBe(episode);
  });

  it.each(SEASONS)('reads the season of %j as %j', (path, season) => {
    expect(resolveEpisode(path)?.seasonNumber ?? null).toBe(season);
  });

  it.each(SIMPLE)(
    'reads %j as %j, season %j, episode %j to %j',
    (path, name, season, episode, ending) => {
      const read = resolveEpisode(path);

      expect(read?.seasonNumber ?? null).toBe(season);
      expect(read?.episodeNumber ?? null).toBe(episode);
      expect(read?.endingEpisodeNumber ?? null).toBe(ending);
      expect(read?.seriesName?.toLowerCase()).toBe(name.toLowerCase());
      expect(read?.isByDate).toBe(false);
    },
  );

  it('reads nothing from a file that is not a video', () => {
    expect(resolveEpisode('test.mp3')).toBeNull();
  });
});
