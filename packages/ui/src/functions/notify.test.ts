import { beforeEach, describe, expect, it, vi } from 'vitest';
import { notify } from './notify';

const cued = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() =>
  Object.assign(
    vi.fn(() => 1),
    { success: vi.fn(() => 2), error: vi.fn(() => 3), loading: vi.fn(() => 4), dismiss: vi.fn() },
  ),
);

vi.mock('@ValenceUI/sounds/cue', () => ({ cue: cued }));
vi.mock('sonner', () => ({ toast }));

beforeEach(() => {
  cued.mockReset();
});

describe('notify', () => {
  it('is heard succeeding and failing', () => {
    notify.worked('Saved.');
    notify.failed('It would not save.');

    expect(cued.mock.calls).toEqual([['success'], ['error']]);
    expect(toast.success).toHaveBeenCalledWith('Saved.', {});
    expect(toast.error).toHaveBeenCalledWith('It would not save.', {});
  });

  it('is heard quietly for news and for work starting, but not for an update to either', () => {
    notify.say('Somebody joined.');
    notify.working('Uploading.');
    notify.say('Two people here.', { id: 'party' });
    notify.working('Halfway.', { id: 'upload' });

    expect(cued.mock.calls).toEqual([
      ['ready', { emphasis: 'subtle' }],
      ['loading', { emphasis: 'subtle' }],
    ]);
  });

  it('takes a message back without a sound', () => {
    notify.forget('party');

    expect(toast.dismiss).toHaveBeenCalledWith('party');
    expect(cued).not.toHaveBeenCalled();
  });
});
