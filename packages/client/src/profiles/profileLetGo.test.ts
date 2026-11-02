import { describe, expect, it, vi } from 'vitest';
import { profileLetGo } from './profileLetGo';

describe('profileLetGo', () => {
  it('tells everybody listening that the profile was let go of', () => {
    const listener = vi.fn();
    const stop = profileLetGo.subscribe(listener);

    profileLetGo.tell();
    stop();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops telling a listener once it has stopped listening', () => {
    const listener = vi.fn();

    profileLetGo.subscribe(listener)();
    profileLetGo.tell();

    expect(listener).not.toHaveBeenCalled();
  });
});
