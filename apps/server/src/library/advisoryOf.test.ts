import { describe, expect, it } from 'vitest';
import { advisoryOf } from './advisoryOf';

describe('advisoryOf', () => {
  it.each([
    ['Violence', 'violence'],
    ['Strong Language', 'language'],
    ['Nudity', 'nudity'],
    ['Sexual Content', 'sex'],
    ['Drug Use', 'drugs'],
    ['Alcohol', 'drugs'],
    ['Frightening Scenes', 'frightening'],
    ['Discrimination', 'discrimination'],
  ] as const)('reads %s as %s', (descriptor, advisory) => {
    expect(advisoryOf(descriptor)).toBe(advisory);
  });

  it('reads nothing into a descriptor that names nothing it knows', () => {
    expect(advisoryOf('Fantasy')).toBeNull();
  });
});
