import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import type { RequestItem } from '@ValenceContracts/schemas/MediaRequest';
import type { StateBadge } from '@ValenceClient/status/StateBadge';
import { say } from '@ValenceI18n/say';
import { REQUEST_STATE_NAMES } from '@ValenceContracts/constants/REQUEST_STATE_NAMES';

/**
 * Sums up where a season of a request has got to from its episodes: whether it is all here, what is
 * on its way, what could not be found, and what has not aired, with how many of them are here.
 *
 * @param items - The season's episodes.
 * @param today - What to treat as today, as `YYYY-MM-DD`, so the phrasing can be tested.
 * @returns The badge's words, tone and line.
 */
const describeSeasonBadge = (
  items: readonly RequestItem[],
  today = new Date().toISOString().slice(0, 10),
): StateBadge => {
  const here = items.filter((item) => item.state === 'available').length;
  const detail = say('client.requests.describeSeasonBadge.hereOfLengthAvailable', {
    here: here.toString(),
    length: items.length.toString(),
  });
  const has = (states: readonly RequestItem['state'][]) =>
    items.some((item) => states.includes(item.state));

  if (here === items.length) {
    return { ...STATUS_LOOK.done, label: REQUEST_STATE_NAMES.available, detail: null };
  }

  if (has(['searching', 'chosen', 'downloading', 'filing', 'filed'])) {
    return { ...STATUS_LOOK.working, label: say('common.downloading'), detail };
  }

  if (has(['wanted', 'failed'])) {
    return { ...STATUS_LOOK.attention, label: REQUEST_STATE_NAMES.wanted, detail };
  }

  const isAired = items.some(
    (item) => item.state === 'waiting' && (item.airDate === null || item.airDate <= today),
  );

  return isAired
    ? { ...STATUS_LOOK.queued, label: say('common.queuedToSearch'), detail }
    : { ...STATUS_LOOK.queued, tone: 'quiet', label: say('common.notOutYet'), detail };
};

export { describeSeasonBadge };
