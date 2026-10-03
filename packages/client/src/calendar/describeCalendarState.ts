import { STATUS_LOOK } from '@ValenceClient/status/STATUS_LOOK';
import { say } from '@ValenceI18n/say';
import type { CalendarState } from '@ValenceContracts/schemas/ReleaseCalendar';
import type { StateBadge } from '@ValenceClient/status/StateBadge';

/**
 * Says where something on the release calendar has got to, in the looks the rest of the app uses
 * for the same states.
 *
 * @param state - Where it is.
 * @returns Its badge.
 */
const describeCalendarState = (state: CalendarState): StateBadge => {
  switch (state) {
    case 'available':
      return { ...STATUS_LOOK.done, label: say('common.available'), detail: null };
    case 'downloading':
      return { ...STATUS_LOOK.working, label: say('common.downloading'), detail: null };
    case 'wanted':
      return { ...STATUS_LOOK.attention, label: say('common.wanted'), detail: null };
    case 'notOutYet':
      return { ...STATUS_LOOK.queued, tone: 'quiet', label: say('common.notOutYet'), detail: null };
    case 'notHeld':
      return {
        ...STATUS_LOOK.stopped,
        label: say('common.notInTheLibrary'),
        detail: null,
      };
  }
};

export { describeCalendarState };
