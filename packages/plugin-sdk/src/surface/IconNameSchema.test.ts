import { describe, expect, it } from 'vitest';
import { IconNameSchema } from './IconNameSchema';
import { ICON_NAMES } from './ICON_NAMES';

describe('IconNameSchema', () => {
  it('accepts only the icons every client draws', () => {
    expect(ICON_NAMES.every((name) => IconNameSchema.safeParse(name).success)).toBe(true);
    expect(IconNameSchema.safeParse('skull').success).toBe(false);
  });
});
