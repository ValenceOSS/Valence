import { describe, expect, it } from 'vitest';
import { createPhoneHandBacks } from './createPhoneHandBacks';

const A_MINUTE = 60 * 1000;

describe('createPhoneHandBacks', () => {
  it('gives back the challenge a code was sent with', () => {
    const handBacks = createPhoneHandBacks();

    handBacks.remember('code', 'challenge');

    expect(handBacks.take('code')).toBe('challenge');
  });

  it('gives it back once and only once', () => {
    const handBacks = createPhoneHandBacks();

    handBacks.remember('code', 'challenge');
    handBacks.take('code');

    expect(handBacks.take('code')).toBeNull();
  });

  it('knows nothing of a code it never sent', () => {
    expect(createPhoneHandBacks().take('made up')).toBeNull();
  });

  it('forgets a code nobody came back for in time', () => {
    let at = 0;
    const handBacks = createPhoneHandBacks(() => at);

    handBacks.remember('code', 'challenge');
    at = 4 * A_MINUTE;

    expect(handBacks.take('code')).toBeNull();
  });

  it('still has it inside the three minutes', () => {
    let at = 0;
    const handBacks = createPhoneHandBacks(() => at);

    handBacks.remember('code', 'challenge');
    at = 2 * A_MINUTE;

    expect(handBacks.take('code')).toBe('challenge');
  });

  it('keeps each code to its own challenge', () => {
    const handBacks = createPhoneHandBacks();

    handBacks.remember('one', 'first');
    handBacks.remember('two', 'second');

    expect(handBacks.take('two')).toBe('second');
    expect(handBacks.take('one')).toBe('first');
  });
});
