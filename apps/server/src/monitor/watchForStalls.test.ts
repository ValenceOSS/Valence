import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchForStalls } from './watchForStalls';

describe('watchForStalls', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says how long the server answered nothing for, and what ran either side of it', () => {
    let clock = 0;
    let runs = ['library.scan'];
    const onStall = vi.fn();
    const stop = watchForStalls({ whatRuns: () => runs, onStall, now: () => clock });

    clock += 500;
    vi.advanceTimersByTime(500);
    runs = ['library.detectSegments'];
    clock += 500 + 7000;
    vi.advanceTimersByTime(500);
    stop();

    expect(onStall).toHaveBeenCalledOnce();
    expect(onStall).toHaveBeenCalledWith(7000, ['library.scan', 'library.detectSegments']);
  });

  it('says nothing while the server keeps answering', () => {
    let clock = 0;
    const onStall = vi.fn();
    const stop = watchForStalls({ whatRuns: () => [], onStall, now: () => clock });

    for (let look = 0; look < 20; look += 1) {
      clock += 500 + 300;
      vi.advanceTimersByTime(500);
    }

    stop();

    expect(onStall).not.toHaveBeenCalled();
  });

  it('names a job once though it ran both before and after', () => {
    let clock = 0;
    const onStall = vi.fn();
    const stop = watchForStalls({ whatRuns: () => ['library.scan'], onStall, now: () => clock });

    clock += 500 + 3000;
    vi.advanceTimersByTime(500);
    stop();

    expect(onStall).toHaveBeenCalledWith(3000, ['library.scan']);
  });
});
