import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'sonner';
import { notify } from './notify';

vi.mock('sonner', () => ({
  toast: {
    custom: vi.fn((_draw: object, options?: { id?: string }) => options?.id ?? 1),
    dismiss: vi.fn(),
  },
}));

afterEach(() => {
  vi.mocked(toast.custom).mockClear();
});

describe('notify.during', () => {
  it('says the work is under way, then turns the same message into how it went', async () => {
    const answered = await notify.during('Backing up…', Promise.resolve(3), (value) => ({
      worked: `Took ${value.toString()}`,
    }));

    const ids = vi.mocked(toast.custom).mock.calls.map((call) => call[1]?.id);

    expect(answered).toBe(3);
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it('turns it into a failure where the outcome says so', async () => {
    await notify.during('Checking…', Promise.resolve(false), () => ({
      failed: 'It did not answer',
    }));

    const last = vi.mocked(toast.custom).mock.calls.at(-1);

    expect(last?.[1]?.duration).not.toBe(Number.POSITIVE_INFINITY);
  });
});
