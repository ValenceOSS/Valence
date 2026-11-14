import { parseAdvancedSubStation } from './parseAdvancedSubStation';

const WEBVTT_HEADER = 'WEBVTT';

const SUBRIP_TIMESTAMP = /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/g;

/**
 * Formats a position as the `hh:mm:ss.mmm` timestamp WebVTT insists on, every field padded to the
 * width the format requires. A position before the start of the file is written as zero.
 *
 * @param totalSeconds - The position to write, in seconds.
 * @returns The timestamp as WebVTT spells it.
 */
const formatTimestamp = (totalSeconds: number): string => {
  const safe = Math.max(0, totalSeconds);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const milliseconds = Math.round((safe - Math.floor(safe)) * 1000);

  const pad = (value: number, width = 2): string => value.toString().padStart(width, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
};

/**
 * Converts a SubRip file to WebVTT, which is the same format in all but three details: the header,
 * the comma before the milliseconds, and hours that SubRip files sometimes write with one digit. A
 * byte order mark and Windows line endings are taken off on the way through, both being things real
 * files carry and browsers refuse.
 *
 * @param source - The subtitle file as SubRip.
 * @returns The same subtitles as WebVTT.
 */
const fromSubRip = (source: string): string => {
  const body = source
    .replace(/^﻿/, '')
    .replace(/\r\n/g, '\n')
    .replace(SUBRIP_TIMESTAMP, (_, hours: string, minutes: string, seconds: string, fraction) =>
      [hours.padStart(2, '0'), minutes, `${seconds}.${String(fraction).padEnd(3, '0')}`].join(':'),
    );

  return `${WEBVTT_HEADER}\n\n${body.trim()}\n`;
};

/**
 * Puts a script's line into the shape a WebVTT cue holds: its words, with no line left blank, since a
 * blank line ends a cue and would cut off everything after it.
 *
 * @param said - The line's words, its breaks already turned into real ones.
 * @returns The words as a cue's text, or nothing where there are none.
 */
const asCueText = (said: string): string =>
  said
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .join('\n');

/**
 * Converts an Advanced SubStation script to WebVTT, reading it the way the styled lines are read so
 * the two forms of a track agree on what is said. Only the words survive: WebVTT has no way to say
 * where a sign goes or what it is dressed in, and a drawing or a run the script made invisible is not
 * words at all.
 *
 * @param source - The subtitle file as Advanced SubStation or SubStation Alpha.
 * @returns The same subtitles as WebVTT, in the order they start, with the styling stripped.
 */
const fromAdvancedSubStation = (source: string): string => {
  const cues = parseAdvancedSubStation(source)
    .cues.slice()
    .sort((one, other) => one.from - other.from)
    .flatMap((cue) => {
      const said = asCueText(cue.spans.map((span) => span.text).join(''));

      return said === ''
        ? []
        : [`${formatTimestamp(cue.from)} --> ${formatTimestamp(cue.to)}\n${said}`];
    });

  return `${WEBVTT_HEADER}\n\n${cues.join('\n\n')}${cues.length === 0 ? '' : '\n'}`;
};

/**
 * Converts a subtitle file to WebVTT, which is the only format a browser will take. A file already
 * in WebVTT is passed through, gaining the header if it was missing one; anything unrecognised is
 * treated as SubRip, that being the format most likely to be mislabelled.
 *
 * @param source - The subtitle file as it was stored.
 * @param format - What the file is meant to be, as the scanner recorded it.
 * @returns The subtitles as WebVTT.
 */
const toWebVtt = (source: string, format: string): string => {
  const normalised = format.toLowerCase();

  if (normalised === 'vtt' || normalised === 'webvtt') {
    return source.trimStart().startsWith(WEBVTT_HEADER)
      ? source
      : `${WEBVTT_HEADER}\n\n${source.trim()}\n`;
  }

  if (normalised === 'ass' || normalised === 'ssa') {
    return fromAdvancedSubStation(source);
  }

  return fromSubRip(source);
};

export { toWebVtt, fromSubRip, fromAdvancedSubStation, formatTimestamp };
