import type { SentDownloadRecord } from '@ValenceRequests/downloads/SentDownloadRecord';

type DownloadRules = {
  metadataForMs: number;
  stalledForMs: number;
  settlesForMs: number;
  wouldTakeLongerThanMs: number;
};

type Judged = {
  isDoomed: boolean;
  reason: string | null;
};

const SECOND = 1000;

const FINE: Judged = { isDoomed: false, reason: null };

/**
 * Says how long something would take, in the largest unit that still says something.
 *
 * @param ms - How long.
 * @returns Such as `3 hours` or `11 days`.
 */
const roughly = (ms: number): string => {
  const hours = ms / (60 * 60 * SECOND);

  if (hours < 48) {
    const whole = Math.max(1, Math.round(hours));

    return `${whole.toString()} ${whole === 1 ? 'hour' : 'hours'}`;
  }

  const days = Math.round(hours / 24);

  return `${days.toString()} ${days === 1 ? 'day' : 'days'}`;
};

/**
 * Decides whether a download is never going to arrive, so the next best release can be tried.
 *
 * Four ways it can be doomed, each of which a person watching the client would call it dead:
 *
 * It failed, which the client has said outright.
 *
 * It never learned what it was. A magnet link has to find somebody willing to tell it what files it
 * holds before it can fetch any of them, and one whose tracker is gone or whose swarm is empty sits
 * there knowing nothing. Judged only on torrents, and only once enough time has passed that a
 * healthy one would have managed it, because a usenet download has no such step and a torrent that
 * has its metadata has a size.
 *
 * It stalled: the client itself says there is nobody to fetch it from, and has said so for long
 * enough that it is not a passing gap in the swarm. A stalled download is judged on that alone —
 * it has by definition stopped moving, and reporting it as too slow would be saying something less
 * true than what the client already said.
 *
 * Or it is moving, but not fast enough to matter. The question asked is not how fast it is going —
 * a slow download of something small still arrives — but whether, at the rate it has averaged, it
 * would still be going long after anybody cared. That question spares a download at 99% that has
 * slowed to a crawl, which a speed limit would throw away with minutes to go.
 *
 * Nothing is judged before it has had time to settle. Every torrent starts at nought bytes a
 * second, and a rule that did not wait would drop every one of them.
 *
 * @param download - The download as the client last left it.
 * @param now - The clock.
 * @param rules - How long to allow for each of those.
 * @returns Whether to give up on it, and what to say.
 */
const judgeDownload = (
  download: Pick<
    SentDownloadRecord,
    'protocol' | 'state' | 'problem' | 'sizeBytes' | 'doneBytes' | 'sentAt' | 'updatedAt'
  >,
  now: Date,
  rules: DownloadRules,
): Judged => {
  if (download.state === 'done' || download.state === 'paused') {
    return FINE;
  }

  if (download.state === 'failed') {
    return { isDoomed: true, reason: download.problem ?? 'The download failed' };
  }

  const since = now.getTime() - Date.parse(download.sentAt);
  const done = download.doneBytes ?? 0;

  if (
    download.protocol === 'torrent' &&
    download.sizeBytes === null &&
    done === 0 &&
    since >= rules.metadataForMs
  ) {
    return {
      isDoomed: true,
      reason: 'It never got its file list, so it never started',
    };
  }

  if (download.state === 'stalled') {
    return now.getTime() - Date.parse(download.updatedAt) >= rules.stalledForMs
      ? { isDoomed: true, reason: 'It stalled, with nobody to fetch it from' }
      : FINE;
  }

  if (since < rules.settlesForMs || download.sizeBytes === null || done <= 0) {
    return FINE;
  }

  const left = download.sizeBytes - done;

  if (left <= 0) {
    return FINE;
  }

  const wouldTake = (left / done) * since;

  return wouldTake <= rules.wouldTakeLongerThanMs
    ? FINE
    : {
        isDoomed: true,
        reason: `At the rate it is going it would take another ${roughly(wouldTake)}`,
      };
};

export type { DownloadRules, Judged };

export { judgeDownload };
