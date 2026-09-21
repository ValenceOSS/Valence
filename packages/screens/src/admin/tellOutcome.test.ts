import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notify } from '@ValenceUI/notify';
import { tellOutcome } from './tellOutcome';

vi.mock('@ValenceUI/notify', () => ({
  notify: { worked: vi.fn(), failed: vi.fn(), say: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tellOutcome', () => {
  it('says what was done where it worked, and answers that it did', () => {
    expect(tellOutcome('Webhook deleted.', null)).toBe(true);
    expect(notify.worked).toHaveBeenCalledWith('Webhook deleted.');
    expect(notify.failed).not.toHaveBeenCalled();
  });

  it('says why where it did not, and answers that it did not', () => {
    expect(tellOutcome('Webhook deleted.', 'That webhook is gone.')).toBe(false);
    expect(notify.failed).toHaveBeenCalledWith('That webhook is gone.');
    expect(notify.worked).not.toHaveBeenCalled();
  });
});
