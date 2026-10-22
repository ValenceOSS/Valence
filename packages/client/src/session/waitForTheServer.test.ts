import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForTheServer } from './waitForTheServer';

const answers = vi.hoisted(() => ({ isUp: vi.fn<() => Promise<boolean>>() }));

vi.mock('@ValenceClient/session/isTheServerUp', () => ({ isTheServerUp: answers.isUp }));

beforeEach(() => {
  vi.useFakeTimers();
  answers.isUp.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('waitForTheServer', () => {
  it('says so once the server answers', async () => {
    answers.isUp.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const onBack = vi.fn();
    const onGaveUp = vi.fn();

    waitForTheServer({ onBack, onGaveUp });
    await vi.advanceTimersByTimeAsync(3000);

    expect(onBack).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(3000);

    expect(onBack).toHaveBeenCalledOnce();
    expect(onGaveUp).not.toHaveBeenCalled();
  });

  it('gives up after two minutes of no answer', async () => {
    answers.isUp.mockResolvedValue(false);
    const onBack = vi.fn();
    const onGaveUp = vi.fn();

    waitForTheServer({ onBack, onGaveUp });
    await vi.advanceTimersByTimeAsync(117_000);

    expect(onGaveUp).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(6000);

    expect(onGaveUp).toHaveBeenCalledOnce();
    expect(onBack).not.toHaveBeenCalled();
  });

  it('stops asking once it is told to', async () => {
    answers.isUp.mockResolvedValue(true);
    const onBack = vi.fn();

    const stop = waitForTheServer({ onBack, onGaveUp: vi.fn() });

    stop();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(answers.isUp).not.toHaveBeenCalled();
    expect(onBack).not.toHaveBeenCalled();
  });
});
