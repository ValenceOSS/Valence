/* oxlint-disable valence/no-hard-coded-strings -- why a trailer could not be found, written to the server's log, which stays English */
import { execFile } from 'node:child_process';
import type { TrailerAnswer } from './TrailerAnswer';
import type { YtDlpSetup } from './YtDlpSetup';

type Ran = {
  failure: { code: string | null; message: string } | null;
  output: string;
  said: string;
};

const A_YOUTUBE_ID = /^[\w-]{11}$/u;

const GIVES_UP_AFTER = 30_000;

const PICTURE_ONLY =
  'bv*[ext=mp4][vcodec^=avc1][height<=1080]/bv*[ext=mp4][height<=1080]/best[ext=mp4][height<=720]';

/**
 * Asks yt-dlp where a YouTube video's picture can be streamed from, without downloading any of it:
 * an H.264 MP4 no taller than 1080 lines where there is one, since every phone, television and
 * browser plays it, and the video alone, since a trailer behind a title plays silent. It runs the
 * YouTube player's challenges in the server's own Node, and reads the server's YouTube cookies
 * where an administrator has given some, which is how a server YouTube has begun refusing gets
 * through.
 *
 * @param youTubeId - Which video, as TMDB gives it.
 * @param setup - Where yt-dlp is, the cookies file it may read, and the Node it may run.
 * @param run - How to run it, for tests.
 * @returns Where the picture is, or why it could not be found.
 */
const askYtDlp = async (
  youTubeId: string,
  setup: YtDlpSetup,
  run: (binary: string, args: readonly string[]) => Promise<Ran> = (binary, args) =>
    new Promise((resolve) => {
      execFile(binary, [...args], { timeout: GIVES_UP_AFTER }, (error, output, said) => {
        resolve({
          failure:
            error === null
              ? null
              : {
                  code: typeof error.code === 'string' ? error.code : null,
                  message: error.message,
                },
          output,
          said,
        });
      });
    }),
): Promise<TrailerAnswer> => {
  if (!A_YOUTUBE_ID.test(youTubeId)) {
    return { kind: 'failed', why: 'not a YouTube video id' };
  }

  const args = [
    '--print',
    'urls',
    '--format',
    PICTURE_ONLY,
    '--no-playlist',
    '--no-warnings',
    '--no-js-runtimes',
    '--js-runtimes',
    `node:${setup.runtime}`,
    ...(setup.cookies === null ? [] : ['--cookies', setup.cookies]),
    '--',
    youTubeId,
  ];

  const { failure, output, said } = await run(setup.binary, args);

  if (failure !== null) {
    return {
      kind: 'failed',
      why: failure.code === 'ENOENT' ? 'yt-dlp is not installed' : said.trim() || failure.message,
    };
  }

  const url = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.startsWith('https://'));

  return url === undefined
    ? { kind: 'failed', why: 'yt-dlp found no picture' }
    : { kind: 'found', url };
};

export { askYtDlp };
