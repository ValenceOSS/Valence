/* oxlint-disable valence/no-hard-coded-strings -- ffmpeg's arguments and what it writes, read by the server rather than shown */
import { execFile } from 'node:child_process';
import type { PictureFraming } from './PictureFraming';

const GIVES_UP_AFTER = 60_000;

const A_VARIANT =
  /#EXT-X-STREAM-INF:[^\n]*CODECS="avc1[^\n]*RESOLUTION=(\d+)x(\d+)[^\n]*\n([^\n#]+)/gu;

const CROPPED = /crop=(\d+):(\d+):(\d+):(\d+)/gu;

const SMALLEST_MEASURED = 360;

/**
 * Runs ffmpeg and reads what it wrote to its error stream, where its filters report.
 *
 * @param ffmpeg - Where ffmpeg is.
 * @param args - Its arguments.
 * @returns What it wrote.
 */
const runFfmpeg = (ffmpeg: string, args: readonly string[]): Promise<string> =>
  new Promise((resolve) => {
    execFile(
      ffmpeg,
      [...args],
      { timeout: GIVES_UP_AFTER, maxBuffer: 16 * 1024 * 1024 },
      (_error, _output, said) => {
        resolve(said);
      },
    );
  });

/**
 * Measures how a trailer's picture sits in its frame: the black bars a widescreen film is
 * letterboxed with, or a narrow one pillarboxed with, so a page can zoom past them.
 *
 * It reads the smallest H.264 picture of at least 360 lines from YouTube's playlist, which is
 * enough to see a bar and quick to read, and has ffmpeg look at every keyframe of it, keeping the
 * widest the picture is ever lit across. A black studio card or a fade does not count as a bar, and
 * one shot that fills the frame means there are none.
 *
 * @param url - YouTube's playlist for the trailer.
 * @param ffmpeg - Where ffmpeg is.
 * @param fetchPlaylist - How to read the playlist, for tests.
 * @param run - How to run ffmpeg, for tests.
 * @returns How the picture sits, in the measured picture's own pixels, or nothing where it could
 *   not be measured.
 */
const measurePictureFraming = async (
  url: string,
  ffmpeg: string,
  fetchPlaylist: typeof fetch = fetch,
  run: (ffmpeg: string, args: readonly string[]) => Promise<string> = runFfmpeg,
): Promise<PictureFraming | null> => {
  const answer = await fetchPlaylist(url).catch(() => null);
  const text = answer?.ok === true ? await answer.text() : '';
  const variants = [...text.matchAll(A_VARIANT)]
    .map(([, wide = '0', high = '0', address = '']) => ({
      wide: Number(wide),
      high: Number(high),
      address: address.trim(),
    }))
    .filter((variant) => variant.high >= SMALLEST_MEASURED)
    .sort((one, other) => one.high - other.high);
  const [chosen] = variants;

  if (chosen === undefined) {
    return null;
  }

  const said = await run(ffmpeg, [
    '-hide_banner',
    '-nostats',
    '-skip_frame',
    'nokey',
    '-i',
    new URL(chosen.address, url).href,
    '-an',
    '-vf',
    'cropdetect=limit=24:round=2:reset=0',
    '-f',
    'null',
    '-',
  ]);
  const last = [...said.matchAll(CROPPED)].at(-1);

  if (last === undefined) {
    return null;
  }

  const [, lit = '0', tall = '0', across = '0', down = '0'] = last;
  const [litWide, litHigh, left, top] = [lit, tall, across, down].map(Number);

  if (litWide === undefined || litHigh === undefined || left === undefined || top === undefined) {
    return null;
  }

  if (litWide <= 0 || litHigh <= 0) {
    return null;
  }

  return {
    wide: chosen.wide,
    high: chosen.high,
    top,
    left,
    right: Math.max(0, chosen.wide - litWide - left),
    bottom: Math.max(0, chosen.high - litHigh - top),
  };
};

export { measurePictureFraming };
