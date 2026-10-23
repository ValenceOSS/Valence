import { describe, expect, it } from 'vitest';
import { createProgressThrottle } from './createProgressThrottle';

const aThrottle = () => {
  let clock = 0;
  const passed: number[] = [];
  const waiting: { run: () => void; at: number }[] = [];

  const throttle = createProgressThrottle<number>({
    everyMs: 1000,
    now: () => clock,
    schedule: (run, afterMs) => {
      const held = { run, at: clock + afterMs };

      waiting.push(held);

      return () => {
        waiting.splice(waiting.indexOf(held), 1);
      };
    },
    pass: (progress) => passed.push(progress),
  });

  const advance = (ms: number) => {
    clock += ms;

    for (const due of waiting.filter((held) => held.at <= clock)) {
      waiting.splice(waiting.indexOf(due), 1);
      due.run();
    }
  };

  return { throttle, passed, advance };
};

describe('createProgressThrottle', () => {
  it('passes the first reading at once, then the latest once a second', () => {
    const { throttle, passed, advance } = aThrottle();

    for (let processed = 1; processed <= 500; processed += 1) {
      throttle.offer('job', processed);
    }

    expect(passed).toStrictEqual([1]);

    advance(1000);

    expect(passed).toStrictEqual([1, 500]);
  });

  it('keeps each job to its own pace', () => {
    const { throttle, passed } = aThrottle();

    throttle.offer('one', 1);
    throttle.offer('two', 2);

    expect(passed).toStrictEqual([1, 2]);
  });

  it('drops what a finished job left waiting', () => {
    const { throttle, passed, advance } = aThrottle();

    throttle.offer('job', 1);
    throttle.offer('job', 2);
    throttle.forget('job');
    advance(1000);

    expect(passed).toStrictEqual([1]);
  });
});
