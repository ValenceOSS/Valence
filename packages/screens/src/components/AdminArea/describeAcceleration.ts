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
      label: say('screens.adminArea.describeAcceleration.softwareOnlyForced'),
      tone: 'warning',
      detail: say('screens.adminArea.describeAcceleration.hardwareEncodingIsTurnedOffSo'),
    };
  }

  if (forced !== '') {
    const name = accelerationOptions.find((option) => option.id === forced)?.label ?? forced;
    const isUnverified = !probed.includes(forced);

    return {
      label: say('screens.adminArea.describeAcceleration.nameForced', { name }),
      tone: isUnverified ? 'danger' : 'quiet',
      detail: isUnverified
        ? say('screens.adminArea.describeAcceleration.thisMachineNeverProvedItCan', { name })
        : say('screens.adminArea.describeAcceleration.nameWasChosenRatherThanLeft', { name }),
    };
  }

  if (probed.length === 0) {
    return {
      label: say('common.softwareOnly'),
      tone: 'quiet',
      detail: say('screens.adminArea.describeAcceleration.thisMachineProvedNoHardwareEncoder'),
    };
  }

  return {
    label: say('screens.adminArea.describeAcceleration.valueAutomatic', {
      value: probed.join(', '),
    }),
    tone: 'quiet',
    detail: say('screens.adminArea.describeAcceleration.valenceUsesWhicheverBackendTheMachine', {
      value: probed.join(' and '),
    }),
  };
};

export { describeAcceleration };
