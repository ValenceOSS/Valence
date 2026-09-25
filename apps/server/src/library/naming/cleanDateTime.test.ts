import { describe, expect, it } from 'vitest';
import { cleanDateTime } from './cleanDateTime';

const CASES: [string, string, number | null][] = [
  ['The Wolf of Wall Street (2013).mkv', 'The Wolf of Wall Street', 2013],
  ['The Wolf of Wall Street 2 (2013).mkv', 'The Wolf of Wall Street 2', 2013],
  ['The Wolf of Wall Street - 2 (2013).mkv', 'The Wolf of Wall Street - 2', 2013],
  ['The Wolf of Wall Street 2001 (2013).mkv', 'The Wolf of Wall Street 2001', 2013],
  ['300 (2006).mkv', '300', 2006],
  ['300 (2006).mkv', '300', 2006],
  ['300 2 (2006).mkv', '300 2', 2006],
  ['300 - 2 (2006).mkv', '300 - 2', 2006],
  ['300 2001 (2006).mkv', '300 2001', 2006],
  ['curse.of.chucky.2013.stv.unrated.multi.1080p.bluray.x264-rough', 'curse.of.chucky', 2013],
  ['curse.of.chucky.2013.stv.unrated.multi.2160p.bluray.x264-rough', 'curse.of.chucky', 2013],
  ['300 (2006).bluray.disc', '300', 2006],
  ['Arrival.2016.2160p.Blu-Ray.HEVC.mkv', 'Arrival', 2016],
  ['The Wolf of Wall Street (2013)', 'The Wolf of Wall Street', 2013],
  ['The Wolf of Wall Street 2 (2013)', 'The Wolf of Wall Street 2', 2013],
  ['The Wolf of Wall Street - 2 (2013)', 'The Wolf of Wall Street - 2', 2013],
  ['The Wolf of Wall Street 2001 (2013)', 'The Wolf of Wall Street 2001', 2013],
  ['300 (2006)', '300', 2006],
  ['300 (2006)', '300', 2006],
  ['300 2 (2006)', '300 2', 2006],
  ['300 - 2 (2006)', '300 - 2', 2006],
  ['300 2001 (2006)', '300 2001', 2006],
  ['300 (2006)', '300', 2006],
  ['300 (2006).mkv', '300', 2006],
  ['American.Psycho.mkv', 'American.Psycho.mkv', null],
  ['American Psycho.mkv', 'American Psycho.mkv', null],
  ['[rec].mkv', '[rec].mkv', null],
  ['St. Vincent (2014)', 'St. Vincent', 2014],
  ['Super movie(2009).mp4', 'Super movie', 2009],
  ['Drug War 2013.mp4', 'Drug War', 2013],
  ['My Movie (1997) - GreatestReleaseGroup 2019.mp4', 'My Movie', 1997],
  ['First Man 2018 1080p.mkv', 'First Man', 2018],
  ['First Man (2018) 1080p.mkv', 'First Man', 2018],
  ['Maximum Ride - 2016 - WEBDL-1080p - x264 AC3.mkv', 'Maximum Ride', 2016],
  ['3 days to kill (2005).mkv', '3 days to kill', 2005],
  ['Rain Man 1988 REMASTERED 1080p BluRay x264 AAC - Ozlem.mp4', 'Rain Man', 1988],
  ['My Movie 2013.12.09', 'My Movie 2013.12.09', null],
  ['My Movie 2013-12-09', 'My Movie 2013-12-09', null],
  ['My Movie 20131209', 'My Movie 20131209', null],
  ['My Movie 2013-12-09 2013', 'My Movie 2013-12-09', 2013],
  ['', '', null],
];

describe('cleanDateTime', () => {
  it.each(CASES)('reads %j as %j from %j', (input, name, year) => {
    const read = cleanDateTime(input);

    expect(read.name.toLowerCase()).toBe(name.toLowerCase());
    expect(read.year).toBe(year);
  });
});
