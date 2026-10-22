import { describe, expect, it, vi } from 'vitest';
import { answerAboutTheScreen } from './answerAboutTheScreen';
import { KEEP_THE_SCREEN_ON } from './screenChannels';

const aWindow = () => {
  const asked = new Map<string, (event: object, isOn: boolean | string) => void>();
  const happenings = new Map<string, () => void>();
  const blocker = { start: vi.fn(() => 7), stop: vi.fn(() => true) };

  answerAboutTheScreen(
    {
      on: (event, listener) => {
        happenings.set(event, listener);
      },
      webContents: {
        on: (event, listener) => {
          happenings.set(event, listener);
        },
        ipc: {
          on: (channel, listener) => {
            asked.set(channel, listener);
          },
        },
      },
    },
    blocker,
  );

  return {
    blocker,
    say: (isOn: boolean | string) => {
      asked.get(KEEP_THE_SCREEN_ON)?.({}, isOn);
    },
    happen: (event: string) => {
      happenings.get(event)?.();
    },
  };
};

describe('answerAboutTheScreen', () => {
  it('keeps the screen on while the page says something plays, and once only', () => {
    const { blocker, say } = aWindow();

    say(true);
    say(true);

    expect(blocker.start).toHaveBeenCalledOnce();
    expect(blocker.start).toHaveBeenCalledWith('prevent-display-sleep');
  });

  it('lets it sleep again once the page says it has stopped', () => {
    const { blocker, say } = aWindow();

    say(true);
    say(false);

    expect(blocker.stop).toHaveBeenCalledWith(7);
  });

  it('takes anything else the page says as stopped', () => {
    const { blocker, say } = aWindow();

    say(true);
    say('yes');

    expect(blocker.stop).toHaveBeenCalledWith(7);
  });

  it('lets it sleep when the page goes elsewhere or the window closes', () => {
    const { blocker, say, happen } = aWindow();

    say(true);
    happen('did-start-navigation');
    say(true);
    happen('closed');

    expect(blocker.stop).toHaveBeenCalledTimes(2);
  });

  it('lets go of nothing it was not holding', () => {
    const { blocker, say, happen } = aWindow();

    say(false);
    happen('closed');

    expect(blocker.stop).not.toHaveBeenCalled();
  });
});
