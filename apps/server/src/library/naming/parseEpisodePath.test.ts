import { describe, expect, it } from 'vitest';
import { parseEpisodePath } from './parseEpisodePath';

const EPISODE_NUMBERS: [string, number | null][] = [
  ['Season 21/One Piece 1001', 1001],
  [
    'Watchmen (2019)/Watchmen 1x03 [WEBDL-720p][EAC3 5.1][h264][-TBS] - She Was Killed by Space Junk.mkv',
    3,
  ],
  ['The Daily Show/The Daily Show 25x22 - [WEBDL-720p][AAC 2.0][x264] Noah Baumbach-TBS.mkv', 22],
  ['Castle Rock 2x01 Que el rio siga su curso [WEB-DL HULU 1080p h264 Dual DD5.1 Subs].mkv', 1],
  ['After Life 1x06 Episodio 6 [WEB-DL NF 1080p h264 Dual DD 5.1 Sub].mkv', 6],
  ['Season 02/S02E03 blah.avi', 3],
  ['Season 2/02x03 - 02x04 - 02x15 - Ep Name.mp4', 3],
  ['Season 02/02x03 - x04 - x15 - Ep Name.mp4', 3],
  ['Season 1/01x02 blah.avi', 2],
  ['Season 1/S01x02 blah.avi', 2],
  ['Season 1/S01E02 blah.avi', 2],
  ['Season 2/Elementary - 02x03-04-15 - Ep Name.mp4', 3],
  ['Season 1/S01xE02 blah.avi', 2],
  ['Season 1/seriesname S01E02 blah.avi', 2],
  ['Season 2/Episode - 16.avi', 16],
  ['Season 2/Episode 16.avi', 16],
  ['Season 2/Episode 16 - Some Title.avi', 16],
  ['Season 2/16 Some Title.avi', 16],
  ['Season 2/16 - 12 Some Title.avi', 16],
  ['Season 2/7 - 12 Angry Men.avi', 7],
  ['Season 1/seriesname 01x02 blah.avi', 2],
  ['Season 25/The Simpsons.S25E09.Steal this episode.mp4', 9],
  ['Season 1/seriesname S01x02 blah.avi', 2],
  ['Season 2/Elementary - 02x03 - 02x04 - 02x15 - Ep Name.mp4', 3],
  ['Season 1/seriesname S01xE02 blah.avi', 2],
  ['Season 02/Elementary - 02x03 - x04 - x15 - Ep Name.mp4', 3],
  ['Season 02/Elementary - 02x03x04x15 - Ep Name.mp4', 3],
  ['Season 2/02x03-04-15 - Ep Name.mp4', 3],
  ['Season 02/02x03-E15 - Ep Name.mp4', 3],
  ['Season 02/Elementary - 02x03-E15 - Ep Name.mp4', 3],
  ['Season 1/Elementary - S01E23-E24-E26 - The Woman.mp4', 23],
  ['Season 2009/S2009E23-E24-E26 - The Woman.mp4', 23],
  ['Season 2009/2009x02 blah.avi', 2],
  ['Season 2009/S2009x02 blah.avi', 2],
  ['Season 2009/S2009E02 blah.avi', 2],
  ['Season 2009/seriesname 2009x02 blah.avi', 2],
  ['Season 2009/Elementary - 2009x03x04x15 - Ep Name.mp4', 3],
  ['Season 2009/2009x03x04x15 - Ep Name.mp4', 3],
  ['Season 2009/Elementary - 2009x03-E15 - Ep Name.mp4', 3],
  ['Season 2009/S2009xE02 blah.avi', 2],
  ['Season 2009/Elementary - S2009E23-E24-E26 - The Woman.mp4', 23],
  ['Season 2009/seriesname S2009xE02 blah.avi', 2],
  ['Season 2009/2009x03-E15 - Ep Name.mp4', 3],
  ['Season 2009/seriesname S2009E02 blah.avi', 2],
  ['Season 2009/2009x03 - 2009x04 - 2009x15 - Ep Name.mp4', 3],
  ['Season 2009/2009x03 - x04 - x15 - Ep Name.mp4', 3],
  ['Season 2009/seriesname S2009x02 blah.avi', 2],
  ['Season 2009/Elementary - 2009x03 - 2009x04 - 2009x15 - Ep Name.mp4', 3],
  ['Season 2009/Elementary - 2009x03-04-15 - Ep Name.mp4', 3],
  ['Season 2009/2009x03-04-15 - Ep Name.mp4', 3],
  ['Season 2009/Elementary - 2009x03 - x04 - x15 - Ep Name.mp4', 3],
  ['Season 1/02 - blah-02 a.avi', 2],
  ['Season 1/02 - blah.avi', 2],
  ['Season 2/02 - blah 14 blah.avi', 2],
  ['Season 2/02.avi', 2],
  ['Season 2/2. Infestation.avi', 2],
  [
    'The Wonder Years/The.Wonder.Years.S04.PDTV.x264-JCH/The Wonder Years s04e07 Christmas Party NTSC PDTV.avi',
    7,
  ],
  ['Running Man/Running Man S2017E368.mkv', 368],
  [
    '/The.Legend.of.Condor.Heroes.2017.V2.web-dl.1080p.h264.aac-hdctv/The.Legend.of.Condor.Heroes.2017.E07.V2.web-dl.1080p.h264.aac-hdctv.mkv',
    7,
  ],
  ['Season 3/The Series Season 3 Episode 9 - The title.avi', 9],
  ['Season 3/The Series S3 E9 - The title.avi', 9],
  ['Season 3/S003 E009.avi', 9],
  ['Season 3/Season 3 Episode 9.avi', 9],
  ['[VCB-Studio] Re Zero kara Hajimeru Isekai Seikatsu [21][Ma10p_1080p][x265_flac].mkv', 21],
  ['[CASO&Sumisora][Oda_Nobuna_no_Yabou][04][BDRIP][1920x1080][x264_AAC][7620E503].mp4', 4],
];

const WHOLE_READINGS: [string, boolean, string, number, number][] = [
  ['/media/Foo/Foo-S01E01', true, 'Foo', 1, 1],
  ['/media/Foo - S04E011', true, 'Foo', 4, 11],
  ['/media/Foo/Foo s01x01', true, 'Foo', 1, 1],
  ['/media/Foo (2019)/Season 4/Foo (2019).S04E03', true, 'Foo (2019)', 4, 3],
  ['D:\\media\\Foo\\Foo-S01E01', true, 'Foo', 1, 1],
  ['D:\\media\\Foo - S04E011', true, 'Foo', 4, 11],
  ['D:\\media\\Foo\\Foo s01x01', true, 'Foo', 1, 1],
  ['D:\\media\\Foo (2019)\\Season 4\\Foo (2019).S04E03', true, 'Foo (2019)', 4, 3],
  ['/Season 2/Elementary - 02x03-04-15 - Ep Name.mp4', false, 'Elementary', 2, 3],
  ['/Season 1/seriesname S01E02 blah.avi', false, 'seriesname', 1, 2],
  ['/Running Man/Running Man S2017E368.mkv', false, 'Running Man', 2017, 368],
  ['/Season 1/seriesname 01x02 blah.avi', false, 'seriesname', 1, 2],
  ['/Season 25/The Simpsons.S25E09.Steal this episode.mp4', false, 'The Simpsons', 25, 9],
  ['/Season 1/seriesname S01x02 blah.avi', false, 'seriesname', 1, 2],
  ['/Season 2/Elementary - 02x03 - 02x04 - 02x15 - Ep Name.mp4', false, 'Elementary', 2, 3],
  ['/Season 1/seriesname S01xE02 blah.avi', false, 'seriesname', 1, 2],
  ['/Season 02/Elementary - 02x03 - x04 - x15 - Ep Name.mp4', false, 'Elementary', 2, 3],
  ['/Season 02/Elementary - 02x03x04x15 - Ep Name.mp4', false, 'Elementary', 2, 3],
  ['/Season 02/Elementary - 02x03-E15 - Ep Name.mp4', false, 'Elementary', 2, 3],
  ['/Season 1/Elementary - S01E23-E24-E26 - The Woman.mp4', false, 'Elementary', 1, 23],
  [
    '/The Wonder Years/The.Wonder.Years.S04.PDTV.x264-JCH/The Wonder Years s04e07 Christmas Party NTSC PDTV.avi',
    false,
    'The Wonder Years',
    4,
    7,
  ],
  [
    '/The.Sopranos/Season 3/The Sopranos Season 3 Episode 09 - The Telltale Moozadell.avi',
    false,
    'The Sopranos',
    3,
    9,
  ],
];

const ENDING_NUMBERS: [string, number | null][] = [
  ['Season 1/4x01 – 20 Hours in America (1).mkv', null],
  ['Season 1/01x02 blah.avi', null],
  ['Season 1/S01x02 blah.avi', null],
  ['Season 1/S01E02 blah.avi', null],
  ['Season 1/S01xE02 blah.avi', null],
  ['Season 1/seriesname 01x02 blah.avi', null],
  ['Season 1/seriesname S01x02 blah.avi', null],
  ['Season 1/seriesname S01E02 blah.avi', null],
  ['Season 1/seriesname S01xE02 blah.avi', null],
  ['Season 2/02x03 - 04 Ep Name.mp4', null],
  ['Season 2/My show name 02x03 - 04 Ep Name.mp4', null],
  ['Season 2/Elementary - 02x03 - 02x04 - 02x15 - Ep Name.mp4', 15],
  ['Season 2/02x03 - 02x04 - 02x15 - Ep Name.mp4', 15],
  ['Season 2/02x03-04-15 - Ep Name.mp4', 15],
  ['Season 2/Elementary - 02x03-04-15 - Ep Name.mp4', 15],
  ['Season 02/02x03-E15 - Ep Name.mp4', 15],
  ['Season 02/Elementary - 02x03-E15 - Ep Name.mp4', 15],
  ['Season 02/02x03 - x04 - x15 - Ep Name.mp4', 15],
  ['Season 02/Elementary - 02x03 - x04 - x15 - Ep Name.mp4', 15],
  ['Season 02/02x03x04x15 - Ep Name.mp4', 15],
  ['Season 02/Elementary - 02x03x04x15 - Ep Name.mp4', 15],
  ['Season 1/Elementary - S01E23-E24-E26 - The Woman.mp4', 26],
  ['Season 1/S01E23-E24-E26 - The Woman.mp4', 26],
  ['Season 2009/2009x02 blah.avi', null],
  ['Season 2009/S2009x02 blah.avi', null],
  ['Season 2009/S2009E02 blah.avi', null],
  ['Season 2009/S2009xE02 blah.avi', null],
  ['Season 2009/seriesname 2009x02 blah.avi', null],
  ['Season 2009/seriesname S2009x02 blah.avi', null],
  ['Season 2009/seriesname S2009E02 blah.avi', null],
  ['Season 2009/seriesname S2009xE02 blah.avi', null],
  ['Season 2009/Elementary - 2009x03 - 2009x04 - 2009x15 - Ep Name.mp4', 15],
  ['Season 2009/2009x03 - 2009x04 - 2009x15 - Ep Name.mp4', 15],
  ['Season 2009/2009x03-04-15 - Ep Name.mp4', 15],
  ['Season 2009/Elementary - 2009x03-04-15 - Ep Name.mp4', 15],
  ['Season 2009/2009x03-E15 - Ep Name.mp4', 15],
  ['Season 2009/Elementary - 2009x03-E15 - Ep Name.mp4', 15],
  ['Season 2009/2009x03 - x04 - x15 - Ep Name.mp4', 15],
  ['Season 2009/Elementary - 2009x03 - x04 - x15 - Ep Name.mp4', 15],
  ['Season 2009/2009x03x04x15 - Ep Name.mp4', 15],
  ['Season 2009/Elementary - 2009x03x04x15 - Ep Name.mp4', 15],
  ['Season 2009/Elementary - S2009E23-E24-E26 - The Woman.mp4', 26],
  ['Season 2009/S2009E23-E24-E26 - The Woman.mp4', 26],
  ['Season 1/02 - blah.avi', null],
  ['Season 2/02 - blah 14 blah.avi', null],
  ['Season 1/02 - blah-02 a.avi', null],
  ['Season 2/02.avi', null],
  ['Season 1/02-03 - blah.avi', 3],
  ['Season 2/02-04 - blah 14 blah.avi', 4],
  ['Season 1/02-05 - blah-02 a.avi', 5],
  ['Season 2/02-04.avi', 4],
  ['Season 2 /[HorribleSubs] Hunter X Hunter - 136[720p].mkv', null],
  ['Season 1/series-s09e14-1080p.mkv', null],
  ['Season 1/series-s09e14-720p.mkv', null],
  ['Season 1/series-s09e14-720i.mkv', null],
  ['Season 1/MOONLIGHTING_s01e01-e04.mkv', 4],
  ['Season 1/MOONLIGHTING_s01e01-e04', 4],
  ['Season 1/S01E01 The 6-10 to Lubbock [WEBRip-1080p][AV1 Opus].mkv', null],
  ['Season 5/S05E23 11-59 [HDTV-1080p][x265 AC3].mkv', null],
  ['Season 5/S05E23 11-59 [HDTV-1080p][HEVC AC3].mkv', null],
  ['Season 1/S01E01 1-23-45 [Bluray-1080p][AV1 Opus].mkv', null],
  ['Season 03/Star Trek Enterprise (2001) - S03E21 - E2 (1080p BluRay x265).mkv', null],
  ['Season 02/Series Name (2001) - S02E10 - E5 [WEBRip-1080p].mkv', null],
];

const LIMITED_RULES: [string, boolean | null, boolean | null][] = [['/test/01-03.avi', true, true]];

describe('parseEpisodePath', () => {
  it.each(EPISODE_NUMBERS)('reads episode %j as %j', (path, episode) => {
    expect(parseEpisodePath(path).episodeNumber).toBe(episode);
  });

  it.each(WHOLE_READINGS)(
    'reads %j (folder: %j) as %j, season %j, episode %j',
    (path, isDirectory, name, season, episode) => {
      const read = parseEpisodePath(path, { isDirectory });

      expect(read.isSuccess).toBe(true);
      expect(read.seriesName).toBe(name);
      expect(read.seasonNumber).toBe(season);
      expect(read.episodeNumber).toBe(episode);
    },
  );

  it.each(ENDING_NUMBERS)('reads the last episode of %j as %j', (path, ending) => {
    expect(parseEpisodePath(path).endingEpisodeNumber).toBe(ending);
  });

  it.each(LIMITED_RULES)('reads %j with only some kinds of rule', (path, isNamed, isOptimistic) => {
    expect(
      parseEpisodePath(path, {
        ...(isNamed === null ? {} : { isNamed }),
        ...(isOptimistic === null ? {} : { isOptimistic }),
      }).isSuccess,
    ).toBe(true);
  });

  it('does not read a picture size as a season and an episode', () => {
    expect(parseEpisodePath('Series Special (1920x1080).mkv').isSuccess).toBe(false);
  });
});
