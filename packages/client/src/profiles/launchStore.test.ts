import { describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { launchStore } from './launchStore';

describe('launchStore', () => {
  it('keeps what it is given in memory where the platform keeps no session', () => {
    launchStore().write('a-key', 'a-value');

    expect(launchStore().read('a-key')).toBe('a-value');
  });

  it('forgets what it is told to', () => {
    launchStore().write('a-key', 'a-value');
    launchStore().forget('a-key');

    expect(launchStore().read('a-key')).toBeNull();
  });

  it('answers nothing for what it was never given', () => {
    expect(launchStore().read('never-written')).toBeNull();
  });

  it('keeps what it is given in the platform’s session where it has one', () => {
    const session = aFakePlatform().store;

    installPlatform(aFakePlatform({ thisLaunch: session }));
    launchStore().write('a-session-key', 'kept');

    expect(session.read('a-session-key')).toBe('kept');

    installPlatform(aFakePlatform());

    expect(launchStore().read('a-session-key')).toBeNull();
  });
});
