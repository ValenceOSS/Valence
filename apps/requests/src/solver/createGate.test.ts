import { describe, expect, it } from 'vitest';
import { createGate } from './createGate';

/**
 * A task that finishes when told to, and says when it started.
 *
 * @param started - Where to note that it started.
 * @param name - What to note.
 * @returns The task, and what finishes it.
 */
const aHeldTask = (started: string[], name: string) => {
  let finish = (): void => {};
  const done = new Promise<string>((resolve) => {
    finish = () => {
      resolve(name);
    };
  });

  return {
    task: () => {
      started.push(name);

      return done;
    },
    finish: () => {
      finish();
    },
  };
};

describe('createGate', () => {
  it('holds back what is over the limit until room opens, in order', async () => {
    const gate = createGate(1);
    const started: string[] = [];
    const first = aHeldTask(started, 'first');
    const second = aHeldTask(started, 'second');
    const third = aHeldTask(started, 'third');

    const all = [gate.run(first.task), gate.run(second.task), gate.run(third.task)];

    await Promise.resolve();
    expect(started).toEqual(['first']);
    expect(gate.busy()).toBe(3);

    first.finish();
    await all[0];
    await Promise.resolve();
    expect(started).toEqual(['first', 'second']);

    second.finish();
    third.finish();

    expect(await Promise.all(all)).toEqual(['first', 'second', 'third']);
    expect(gate.busy()).toBe(0);
  });

  it('makes room again when a task fails', async () => {
    const gate = createGate(1);

    await expect(gate.run(() => Promise.reject(new Error('no')))).rejects.toThrow('no');

    expect(await gate.run(() => Promise.resolve('yes'))).toBe('yes');
    expect(gate.busy()).toBe(0);
  });
});
