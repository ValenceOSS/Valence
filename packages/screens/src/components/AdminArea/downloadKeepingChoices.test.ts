import { describe, expect, it } from 'vitest';
import { say } from '@ValenceI18n/say';
import { downloadKeepingChoices } from './downloadKeepingChoices';

describe('downloadKeepingChoices', () => {
  it('offers whole numbers of days, with nought meaning until deleted', () => {
    expect(downloadKeepingChoices.every((choice) => /^\d+$/u.test(choice.id))).toBe(true);
    const forever = downloadKeepingChoices.find((choice) => choice.id === '0');

    expect(forever === undefined ? null : say(forever.labelKey)).toBe('Until deleted');
  });
});
