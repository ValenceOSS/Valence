import { describe, expect, it } from 'vitest';
import { identifyDevice } from '@ValenceCore/functions/identifyDevice';
import type { AskingDevice } from '@ValenceServer/devices/createAskingDevices';
import { createAskingDevices } from './createAskingDevices';

const A_TELEVISION: AskingDevice = {
  deviceId: 'living-room-tv',
  address: '192.168.1.30',
  identity: identifyDevice({ userAgent: null, kind: 'tv', hints: { system: 'tvos' } }),
};

const ANOTHER_TELEVISION: AskingDevice = {
  deviceId: 'bedroom-tv',
  address: '192.168.1.31',
  identity: identifyDevice({ userAgent: null, kind: 'tv', hints: { system: 'androidTv' } }),
};

const TEN_MINUTES = 10 * 60 * 1000;

const withAClock = () => {
  let at = 1_000_000;

  return {
    asking: createAskingDevices(() => at),
    wait: (ms: number) => {
      at += ms;
    },
  };
};

describe('createAskingDevices', () => {
  it('says which device asked for a code', () => {
    const { asking } = withAClock();

    asking.note('ABCD-EFGH', A_TELEVISION);

    expect(asking.read('ABCD-EFGH')).toStrictEqual(A_TELEVISION);
  });

  it('knows nothing of a code nobody asked for', () => {
    const { asking } = withAClock();

    asking.note('ABCD-EFGH', A_TELEVISION);

    expect(asking.read('WXYZ-1234')).toBeNull();
  });

  it('finds a code however it was typed, in small letters or without its dash', () => {
    const { asking } = withAClock();

    asking.note('ABCD-EFGH', A_TELEVISION);

    expect(asking.read('abcd-efgh')).toStrictEqual(A_TELEVISION);
    expect(asking.read('ABCDEFGH')).toStrictEqual(A_TELEVISION);
    expect(asking.read(' abcd efgh ')).toStrictEqual(A_TELEVISION);
  });

  it('keeps a code for ten minutes and forgets it after', () => {
    const { asking, wait } = withAClock();

    asking.note('ABCD-EFGH', A_TELEVISION);
    wait(TEN_MINUTES);

    expect(asking.read('ABCD-EFGH')).toStrictEqual(A_TELEVISION);

    wait(1);

    expect(asking.read('ABCD-EFGH')).toBeNull();
  });

  it('says the newest device to ask for a code where two asked', () => {
    const { asking } = withAClock();

    asking.note('ABCD-EFGH', A_TELEVISION);
    asking.note('abcdefgh', ANOTHER_TELEVISION);

    expect(asking.read('ABCD-EFGH')).toStrictEqual(ANOTHER_TELEVISION);
  });

  it('keeps the newest five hundred codes, so a flood cannot fill the server’s memory', () => {
    const { asking } = withAClock();

    for (let count = 0; count < 600; count += 1) {
      asking.note(`CODE${count.toString()}`, A_TELEVISION);
    }

    const kept = Array.from({ length: 600 }, (_, count) => asking.read(`CODE${count.toString()}`));

    expect(kept.filter((one) => one !== null)).toHaveLength(500);
    expect(asking.read('CODE99')).toBeNull();
    expect(asking.read('CODE100')).toStrictEqual(A_TELEVISION);
    expect(asking.read('CODE599')).toStrictEqual(A_TELEVISION);
  });

  it('keeps a code asked for again among the newest, rather than the first to go', () => {
    const { asking } = withAClock();

    asking.note('KEPT', A_TELEVISION);

    for (let count = 0; count < 499; count += 1) {
      asking.note(`CODE${count.toString()}`, A_TELEVISION);
    }

    asking.note('KEPT', ANOTHER_TELEVISION);
    asking.note('ONE-MORE', A_TELEVISION);

    expect(asking.read('KEPT')).toStrictEqual(ANOTHER_TELEVISION);
    expect(asking.read('CODE0')).toBeNull();
  });
});
