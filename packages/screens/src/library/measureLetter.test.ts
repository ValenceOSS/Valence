import { describe, expect, it } from 'vitest';
import { measureLetter } from './measureLetter';

describe('measureLetter', () => {
  it('gives nothing where there is no canvas to draw on', () => {
    expect(measureLetter('D', 'sans-serif', 600)).toBeNull();
  });
});
