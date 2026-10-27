import { describe, expect, it, vi } from 'vitest';
import { rememberFor } from './rememberFor';

describe('rememberFor', () => {
  it('works an answer out once while it lasts, and again once it has gone', async () => {
    const clock = { now: 0 };
    const make = vi.fn(() => Promise.resolve(clock.now));
    const remembered = rememberFor<number>(1000, () => clock.now);

    await expect(remembered.get('list', 'pat', make)).resolves.toBe(0);
    clock.now = 999;
    await expect(remembered.get('list', 'pat', make)).resolves.toBe(0);
    clock.now = 1000;
    await expect(remembered.get('list', 'pat', make)).resolves.toBe(1000);
    expect(make).toHaveBeenCalledTimes(2);
  });

  it('keeps each list’s answer for each asker apart', async () => {
    const remembered = rememberFor<string>(1000, () => 0);

    await remembered.get('list', 'pat', () => Promise.resolve('pat'));

    await expect(remembered.get('list', 'sam', () => Promise.resolve('sam'))).resolves.toBe('sam');
    await expect(remembered.get('other', 'pat', () => Promise.resolve('other'))).resolves.toBe(
      'other',
    );
  });

  it('forgets every answer about a list once it changes', async () => {
    const remembered = rememberFor<string>(1000, () => 0);

    await remembered.get('list', 'pat', () => Promise.resolve('before'));
    remembered.forget('list');

    await expect(remembered.get('list', 'pat', () => Promise.resolve('after'))).resolves.toBe(
      'after',
    );
  });

  it('shares one answer between callers asking at once, and keeps no failure', async () => {
    const remembered = rememberFor<string>(1000, () => 0);
    const make = vi.fn(() => Promise.reject(new Error('down')));

    const [first, second] = [
      remembered.get('list', 'pat', make),
      remembered.get('list', 'pat', make),
    ];

    await expect(first).rejects.toThrow('down');
    await expect(second).rejects.toThrow('down');
    expect(make).toHaveBeenCalledTimes(1);
    await expect(remembered.get('list', 'pat', () => Promise.resolve('again'))).resolves.toBe(
      'again',
    );
  });
});
