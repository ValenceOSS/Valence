import { describe, expect, it } from 'vitest';
import { splitElapsed } from './splitElapsed';

describe('splitElapsed', () => {
  it('says a moment in milliseconds', () => {
    expect(splitElapsed(850)).toStrictEqual([{ value: 850, unit: 'ms', isFractional: false }]);
  });

  it('says a few seconds to a tenth of one', () => {
    expect(splitElapsed(1400)).toStrictEqual([{ value: 1.4, unit: 's', isFractional: true }]);
  });

  it('says ten seconds or more in whole seconds', () => {
    expect(splitElapsed(12_400)).toStrictEqual([{ value: 12, unit: 's', isFractional: false }]);
  });

  it('says minutes and the seconds after them, and leaves out seconds that are none', () => {
    expect(splitElapsed(125_000)).toStrictEqual([
      { value: 2, unit: 'min', isFractional: false },
      { value: 5, unit: 's', isFractional: false },
    ]);
    expect(splitElapsed(120_000)).toStrictEqual([{ value: 2, unit: 'min', isFractional: false }]);
  });

  it('says hours and the minutes after them, and leaves out minutes that are none', () => {
    expect(splitElapsed(3_780_000)).toStrictEqual([
      { value: 1, unit: 'h', isFractional: false },
      { value: 3, unit: 'min', isFractional: false },
    ]);
    expect(splitElapsed(3_600_000)).toStrictEqual([{ value: 1, unit: 'h', isFractional: false }]);
  });
});
