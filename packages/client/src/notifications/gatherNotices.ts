import { sayCount } from '@ValenceI18n/sayCount';

type Notice = { title: string; body: string; link: string };

type Gathered = {
  title: string;
  body: string;
  link: string;
  notices: Notice[];
  firstShownAt: number;
  renotify: boolean;
};

const BURST_MS = 60_000;

const NAMED_AT_MOST = 3;

/**
 * What a device shows when a notification arrives while another of Valence's is still on screen:
 * the two gathered into one, saying how many there are and naming the first few, each once, rather
 * than each replacing the last. Notices that come all at once — a device back online after a night asleep,
 * handed everything the push service held for it — make a sound once, for the first of them, and
 * then gather quietly.
 *
 * @param showing - The notification on screen, with the notices it stands for, or nothing.
 * @param arriving - The notice that has just arrived.
 * @param now - The moment it arrived.
 * @returns What to show now.
 */
const gatherNotices = (
  showing: { notices: readonly Notice[]; firstShownAt: number } | null,
  arriving: Notice,
  now: number,
): Gathered => {
  if (showing === null || showing.notices.length === 0) {
    return { ...arriving, notices: [arriving], firstShownAt: now, renotify: true };
  }

  const notices = [...showing.notices, arriving];
  const isBurst = now - showing.firstShownAt < BURST_MS;
  const titles = [...new Set(notices.map((notice) => notice.title))];
  const rest = titles.length - NAMED_AT_MOST;
  const named = new Intl.ListFormat(undefined, {
    style: rest > 0 ? 'short' : 'long',
    type: rest > 0 ? 'unit' : 'conjunction',
  }).format(titles.slice(0, NAMED_AT_MOST));

  return {
    title: sayCount('common.countNewNotifications', notices.length),
    body: rest > 0 ? sayCount('common.list.andMore', rest, { listed: named }) : named,
    link: '/',
    notices,
    firstShownAt: isBurst ? showing.firstShownAt : now,
    renotify: !isBurst,
  };
};

export { gatherNotices };
export type { Notice };
