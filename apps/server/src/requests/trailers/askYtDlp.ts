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

const STREAMED = 'bv*[protocol^=m3u8][vcodec^=avc1]';

const A_PLAYLIST = 'https://manifest.googlevideo.com/';

/**
 * Asks yt-dlp where a YouTube video is streamed from, without downloading any of it: the address of
 * YouTube's HLS playlist for it, which lists the picture in H.264 at every size up to 1080 lines
 * and the sound beside it, for a phone's own player to stream and put together. It runs the YouTube
 * player's challenges in the server's own Node, and reads the server's YouTube cookies where an
 * administrator has given some, which is how a server YouTube has begun refusing gets through.
 *
 * @param youTubeId - Which video, as TMDB gives it.
 * @param setup - Where yt-dlp is, the cookies file it may read, and the Node it may run.
 * @param run - How to run it, for tests.
 * @returns Where the playlist is, or why it could not be found.
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
    '%(manifest_url)s',
    '--format',
    STREAMED,
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
    .find((line) => line.startsWith(A_PLAYLIST));

  return url === undefined
    ? { kind: 'failed', why: 'yt-dlp found no stream' }
    : { kind: 'found', url };
};

export { askYtDlp };
