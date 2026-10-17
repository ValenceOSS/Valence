import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';

type Asking = { returnValue?: Record<string, string> };

type Said = (event: Asking, ...what: JsonValue[]) => void;

const listening = new Map<string, Said>();

vi.mock('electron', () => ({
  ipcMain: {
    on: (channel: string, said: Said) => {
      listening.set(channel, said);
    },
  },
}));

const { answerAboutThisLaunch } = await import('./answerAboutThisLaunch');
const { FORGET_THIS_LAUNCH, READ_THIS_LAUNCH, WRITE_THIS_LAUNCH } =
  await import('./launchChannels');

const asked = (channel: string, ...what: JsonValue[]): Record<string, string> | undefined => {
  const event: Asking = {};

  listening.get(channel)?.(event, ...what);

  return event.returnValue;
};

beforeEach(() => {
  listening.clear();
});

describe('answerAboutThisLaunch', () => {
  it('starts with nothing, since every start of the application begins again', () => {
    answerAboutThisLaunch();

    expect(asked(READ_THIS_LAUNCH)).toEqual({});
  });

  it('hands back what a window wrote, to that window or the next', () => {
    answerAboutThisLaunch();
    asked(WRITE_THIS_LAUNCH, 'valence.chosenThisLaunch', 'account-1');

    expect(asked(READ_THIS_LAUNCH)).toEqual({ 'valence.chosenThisLaunch': 'account-1' });
  });

  it('lets go of what a window forgot', () => {
    answerAboutThisLaunch();
    asked(WRITE_THIS_LAUNCH, 'valence.askingFor', 'profile-1');
    asked(FORGET_THIS_LAUNCH, 'valence.askingFor');

    expect(asked(READ_THIS_LAUNCH)).toEqual({});
  });

  it('keeps nothing it is handed that is not a pair of strings', () => {
    answerAboutThisLaunch();
    asked(WRITE_THIS_LAUNCH, 'valence.askingFor', 7);

    expect(asked(READ_THIS_LAUNCH)).toEqual({});
  });
});
