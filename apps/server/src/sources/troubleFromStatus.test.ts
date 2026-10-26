import { describe, expect, it } from 'vitest';
import { troubleFromStatus } from './troubleFromStatus';

describe('troubleFromStatus', () => {
  it.each([
    [429, 'rateLimited'],
    [401, 'keyRefused'],
    [403, 'refused'],
    [500, 'faulty'],
    [503, 'faulty'],
  ] as const)('reads %i as %s', (status, reason) => {
    expect(troubleFromStatus(status)).toBe(reason);
  });

  it.each([400, 404, 410])('reads %i as the site having nothing, not as trouble', (status) => {
    expect(troubleFromStatus(status)).toBeNull();
  });
});
