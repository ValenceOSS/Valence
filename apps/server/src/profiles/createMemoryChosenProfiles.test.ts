import { describe, expect, it } from 'vitest';
import { createMemoryChosenProfiles } from './createMemoryChosenProfiles';

describe('createMemoryChosenProfiles', () => {
  it('has nobody chosen for a session that never chose', async () => {
    await expect(createMemoryChosenProfiles().chosenFor('session-1')).resolves.toBeNull();
  });

  it('remembers who a session chose', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.choose('session-1', 'kid');

    await expect(chosen.chosenFor('session-1')).resolves.toBe('kid');
  });

  it('keeps only the latest choice', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.choose('session-1', 'kid');
    await chosen.choose('session-1', 'parent');

    await expect(chosen.chosenFor('session-1')).resolves.toBe('parent');
  });

  it('keeps one session’s choice from another', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.choose('session-1', 'kid');

    await expect(chosen.chosenFor('session-2')).resolves.toBeNull();
  });

  it('forgets a choice, so somebody has to choose again', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.choose('session-1', 'kid');
    await chosen.forget('session-1');

    await expect(chosen.chosenFor('session-1')).resolves.toBeNull();
  });

  it('forgets one session without forgetting another', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.choose('session-1', 'kid');
    await chosen.choose('session-2', 'parent');
    await chosen.forget('session-1');

    await expect(chosen.chosenFor('session-2')).resolves.toBe('parent');
  });

  it('has no profile for a key that was never tied to one', async () => {
    await expect(createMemoryChosenProfiles().keyProfileOf('key-1')).resolves.toBeNull();
  });

  it('remembers which profile a key acts for, and only the latest', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.tieKey('key-1', 'kid');
    await chosen.tieKey('key-1', 'parent');

    await expect(chosen.keyProfileOf('key-1')).resolves.toBe('parent');
  });

  it('keeps keys and sessions apart, even under the same identifier', async () => {
    const chosen = createMemoryChosenProfiles();

    await chosen.tieKey('same', 'kid');

    await expect(chosen.chosenFor('same')).resolves.toBeNull();

    await chosen.choose('same', 'parent');
    await chosen.forget('same');

    await expect(chosen.keyProfileOf('same')).resolves.toBe('kid');
  });
});
