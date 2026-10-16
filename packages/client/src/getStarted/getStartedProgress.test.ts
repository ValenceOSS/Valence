import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { readGetStartedProgress, saveGetStartedProgress } from './getStartedProgress';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('getStartedProgress', () => {
  it('has nothing done for an account that has not started', () => {
    expect(readGetStartedProgress('user-1')).toEqual({
      done: [],
      skipped: [],
      isDismissed: false,
      isCollapsed: false,
    });
  });

  it('remembers what an account has done and keeps the rest', () => {
    saveGetStartedProgress('user-1', { done: ['library'] });
    saveGetStartedProgress('user-1', { isCollapsed: true });

    expect(readGetStartedProgress('user-1')).toMatchObject({
      done: ['library'],
      isCollapsed: true,
    });
  });

  it('keeps each account’s progress apart', () => {
    saveGetStartedProgress('user-1', { isDismissed: true });

    expect(readGetStartedProgress('user-2').isDismissed).toBe(false);
  });

  it('hands back the progress as it now stands', () => {
    expect(saveGetStartedProgress('user-1', { skipped: ['email'] }).skipped).toEqual(['email']);
  });

  it('starts again where what was kept will not read', () => {
    platformInUse().store.write('valence.getStarted', 'not json');

    expect(readGetStartedProgress('user-1').done).toEqual([]);
  });

  it('starts again where what was kept is the wrong shape', () => {
    platformInUse().store.write('valence.getStarted', JSON.stringify({ 'user-1': { done: 3 } }));

    expect(readGetStartedProgress('user-1').done).toEqual([]);
  });
});
