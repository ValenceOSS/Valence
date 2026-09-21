import { describe, expect, it } from 'vitest';
import { describeLogSpan, describeLogTick } from './describeLogTick';
import { describeLogDay, describeLogTime } from './describeLogTime';

const AT = new Date(2026, 8, 21, 14, 3, 9).getTime();

describe('describeLogTick', () => {
  it('says the time to the second across an hour or less', () => {
    expect(describeLogTick(AT, 3_600_000)).toBe(describeLogTime(AT));
  });

  it('says the time to the minute across a day', () => {
    expect(describeLogTick(AT, 86_400_000)).toBe(describeLogTime(AT).slice(0, 5));
  });

  it('says the day across two days or more', () => {
    expect(describeLogTick(AT, 7 * 86_400_000)).toBe(describeLogDay(AT));
  });
});

describe('describeLogSpan', () => {
  it('says the day and the two ends of the stretch', () => {
    expect(describeLogSpan(AT, AT + 60_000)).toBe(
      `${describeLogDay(AT)}, ${describeLogTime(AT)} – ${describeLogTime(AT + 60_000)}`,
    );
  });
});
