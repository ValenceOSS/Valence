import { describe, expect, it } from 'vitest';
import { downloadKeepingChoices } from './downloadKeepingChoices';

describe('downloadKeepingChoices', () => {
  it('offers whole numbers of days, with nought meaning until deleted', () => {
    expect(downloadKeepingChoices.every((choice) => /^\d+$/u.test(choice.id))).toBe(true);
    expect(downloadKeepingChoices.find((choice) => choice.id === '0')?.label).toBe('Until deleted');
  });
});
