import { describe, expect, it } from 'vitest';
import { parseSeasonFolder } from './parseSeasonFolder';

const IN_PROGRAMMES: [string, string | null, number | null, boolean][] = [
  ['/Drive/Season 1', '/Drive', 1, true],
  ['/Drive/SEASON 1', '/Drive', 1, true],
  ['/Drive/Staffel 1', '/Drive', 1, true],
  ['/Drive/STAFFEL 1', '/Drive', 1, true],
  ['/Drive/Stagione 1', '/Drive', 1, true],
  ['/Drive/STAGIONE 1', '/Drive', 1, true],
  ['/Drive/sæson 1', '/Drive', 1, true],
  ['/Drive/SÆSON 1', '/Drive', 1, true],
  ['/Drive/Temporada 1', '/Drive', 1, true],
  ['/Drive/TEMPORADA 1', '/Drive', 1, true],
  ['/Drive/series 1', '/Drive', 1, true],
  ['/Drive/SERIES 1', '/Drive', 1, true],
  ['/Drive/Kausi 1', '/Drive', 1, true],
  ['/Drive/KAUSI 1', '/Drive', 1, true],
  ['/Drive/Säsong 1', '/Drive', 1, true],
  ['/Drive/SÄSONG 1', '/Drive', 1, true],
  ['/Drive/Seizoen 1', '/Drive', 1, true],
  ['/Drive/SEIZOEN 1', '/Drive', 1, true],
  ['/Drive/Seasong 1', '/Drive', 1, true],
  ['/Drive/SEASONG 1', '/Drive', 1, true],
  ['/Drive/Sezon 1', '/Drive', 1, true],
  ['/Drive/SEZON 1', '/Drive', 1, true],
  ['/Drive/sezona 1', '/Drive', 1, true],
  ['/Drive/SEZONA 1', '/Drive', 1, true],
  ['/Drive/sezóna 1', '/Drive', 1, true],
  ['/Drive/SEZÓNA 1', '/Drive', 1, true],
  ['/Drive/Sezonul 1', '/Drive', 1, true],
  ['/Drive/SEZONUL 1', '/Drive', 1, true],
  ['/Drive/시즌 1', '/Drive', 1, true],
  ['/Drive/シーズン 1', '/Drive', 1, true],
  ['/Drive/сезон 1', '/Drive', 1, true],
  ['/Drive/Сезон 1', '/Drive', 1, true],
  ['/Drive/СЕЗОН 1', '/Drive', 1, true],
  ['/Drive/Season 10', '/Drive', 10, true],
  ['/Drive/Season 100', '/Drive', 100, true],
  ['/Drive/s1', '/Drive', 1, true],
  ['/Drive/S1', '/Drive', 1, true],
  ['/Drive/Season 2', '/Drive', 2, true],
  ['/Drive/Season 02', '/Drive', 2, true],
  ['/Drive/Seinfeld/S02', '/Seinfeld', 2, true],
  ['/Drive/Seinfeld/2', '/Seinfeld', 2, true],
  ['/Drive/Seinfeld Season 2', '/Drive', null, false],
  ['/Drive/Season 2009', '/Drive', 2009, true],
  ['/Drive/Season1', '/Drive', 1, true],
  ['The Wonder Years/The.Wonder.Years.S04.PDTV.x264-JCH', '/The Wonder Years', 4, true],
  ['/Drive/Season 7 (2016)', '/Drive', 7, true],
  ['/Drive/Staffel 7 (2016)', '/Drive', 7, true],
  ['/Drive/Stagione 7 (2016)', '/Drive', 7, true],
  ['/Drive/Stargate SG-1/Season 1', '/Drive/Stargate SG-1', 1, true],
  ['/Drive/Stargate SG-1/Stargate SG-1 Season 1', '/Drive/Stargate SG-1', 1, true],
  ['/Drive/Season (8)', '/Drive', null, false],
  ['/Drive/3.Staffel', '/Drive', 3, true],
  ['/Drive/s06e05', '/Drive', null, false],
  ['/Drive/The.Legend.of.Condor.Heroes.2017.V2.web-dl.1080p.h264.aac-hdctv', '/Drive', null, false],
  ['/Drive/extras', '/Drive', 0, true],
  ['/Drive/EXTRAS', '/Drive', 0, true],
  ['/Drive/specials', '/Drive', 0, true],
  ['/Drive/SPECIALS', '/Drive', 0, true],
  ['/Drive/Episode 1 Season 2', '/Drive', null, false],
  ['/Drive/Episode 1 SEASON 2', '/Drive', null, false],
  [
    '/media/YouTube/Devyn Johnston/2024-01-24 4070 Ti SUPER in under 7 minutes',
    '/media/YouTube/Devyn Johnston',
    null,
    false,
  ],
  [
    '/media/YouTube/Devyn Johnston/2025-01-28 5090 vs 2 SFF Cases',
    '/media/YouTube/Devyn Johnston',
    null,
    false,
  ],
  ['/Drive/202401244070', '/Drive', null, false],
  ['/Drive/Drive.S01.2160p.WEB-DL.DDP5.1.H.265-XXXX', '/Drive', 1, true],
  ['The Wonder Years/The.Wonder.Years.S04.1080p.PDTV.x264-JCH', '/The Wonder Years', 4, true],
  ['The Wonder Years/[The.Wonder.Years.S04.1080p.PDTV.x264-JCH]', '/The Wonder Years', 4, true],
  ['The Wonder Years/The.Wonder.Years [S04][1080p.PDTV.x264-JCH]', '/The Wonder Years', 4, true],
  ['The Wonder Years/The Wonder Years Season 01 1080p', '/The Wonder Years', 1, true],
];

const IN_MIXED_LIBRARIES: [string, string | null, number | null, boolean][] = [
  ['/Drive/300 Collection/300 (2006)', '/Drive/300 Collection', null, false],
  ['/Drive/300 Collection/300 Rise of an Empire', '/Drive/300 Collection', null, false],
  ['/Drive/300 Collection/1', '/Drive/300 Collection', null, false],
  ['/Drive/300 Collection/300 Disc 1', '/Drive/300 Collection', null, false],
  [
    '/Drive/28 Years Later Collection/28 Days Later',
    '/Drive/28 Years Later Collection',
    null,
    false,
  ],
  [
    '/Drive/28 Years Later Collection/28 Weeks Later (2007)',
    '/Drive/28 Years Later Collection',
    null,
    false,
  ],
  [
    '/Drive/28 Years Later Collection/28 Years Later 2025',
    '/Drive/28 Years Later Collection',
    null,
    false,
  ],
  ['/Drive/300 Collection/Season 1', '/Drive/300 Collection', 1, true],
  ['/Drive/28 Years Later Collection/Season 01', '/Drive/28 Years Later Collection', 1, true],
  ['/Drive/300 Collection/S01', '/Drive/300 Collection', 1, true],
  ['/Drive/300 Collection/S1', '/Drive/300 Collection', 1, true],
];

describe('parseSeasonFolder', () => {
  it.each(IN_PROGRAMMES)(
    'reads %j under %j as season %j (a season folder: %j)',
    (path, parent, season, isSeasonFolder) => {
      expect(parseSeasonFolder(path, parent, true, true)).toEqual({
        seasonNumber: season,
        isSeasonFolder,
      });
    },
  );

  it.each(IN_MIXED_LIBRARIES)(
    'reads %j under %j in a mixed library as season %j (%j)',
    (path, parent, season, isSeasonFolder) => {
      expect(parseSeasonFolder(path, parent, false, false)).toEqual({
        seasonNumber: season,
        isSeasonFolder,
      });
    },
  );
});
