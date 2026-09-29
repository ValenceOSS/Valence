import { describe, expect, it, vi } from 'vitest';
import { keepTheLatest } from './keepTheLatest';

describe('keepTheLatest', () => {
  it('knows what it started with', () => {
    expect(keepTheLatest('none').now()).toBe('none');
  });

  it('hands a late listener what was said before it joined', () => {
    const kept = keepTheLatest('none');
    const listener = vi.fn();

    kept.set('1.2.0');
    kept.whenChanged(listener);

    expect(listener).toHaveBeenCalledWith('1.2.0');
  });

  it('tells every listener what is said after they joined', () => {
    const kept = keepTheLatest('none');
    const first = vi.fn();
    const second = vi.fn();

    kept.whenChanged(first);
    kept.whenChanged(second);
    kept.set('1.2.0');

    expect(first).toHaveBeenLastCalledWith('1.2.0');
    expect(second).toHaveBeenLastCalledWith('1.2.0');
    expect(kept.now()).toBe('1.2.0');
  });

  it('tells a listener nothing more once it has gone', () => {
    const kept = keepTheLatest('none');
    const listener = vi.fn();

    const leave = kept.whenChanged(listener);

    leave();
    kept.set('1.2.0');

    expect(listener).toHaveBeenCalledOnce();
  });
});
