import { accelerationOptions } from '@ValenceScreens/components/AdminArea/accelerationOptions';
import { say } from '@ValenceI18n/say';

type Acceleration = {
  label: string;
  tone: 'quiet' | 'warning' | 'danger';
  detail: string;
};

/**
 * Says what the next transcode will actually use, and how much to worry about it. The interesting
 * case is an encoder forced by hand that the machine never proved it has: every transcode silently
 * falls back to software, which is the sort of thing that shows up as unexplained load rather than
 * as an error.
 *
 * @param forced - The encoder chosen by hand, or an empty string for automatic.
 * @param probed - The encoders this machine proved it can use.
 * @returns What to call it, how alarming it is, and what it means in practice.
 */
const describeAcceleration = (forced: string, probed: string[]): Acceleration => {
  if (forced === 'none') {
    return {
      label: say('admin.describeAcceleration.softwareForced'),
      tone: 'warning',
      detail: say('admin.describeAcceleration.softwareForcedDetail'),
    };
  }

  if (forced !== '') {
    const option = accelerationOptions.find((candidate) => candidate.id === forced);
    const name = option === undefined ? forced : say(option.labelKey);
    const isUnverified = !probed.includes(forced);

    return {
      label: say('admin.describeAcceleration.forced', { name }),
      tone: isUnverified ? 'danger' : 'quiet',
      detail: isUnverified
        ? say('admin.describeAcceleration.forcedUnproved', { name })
        : say('admin.describeAcceleration.forcedProved', { name }),
    };
  }

  if (probed.length === 0) {
    return {
      label: say('admin.describeAcceleration.software'),
      tone: 'quiet',
      detail: say('admin.describeAcceleration.softwareDetail'),
    };
  }

  return {
    label: say('admin.describeAcceleration.automatic', {
      encoders: probed.join(say('admin.describeAcceleration.listSeparator')),
    }),
    tone: 'quiet',
    detail: say('admin.describeAcceleration.automaticDetail', {
      encoders: probed.join(say('admin.describeAcceleration.lastSeparator')),
    }),
  };
};

export { describeAcceleration };
