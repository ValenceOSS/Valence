import { describe, expect, it } from 'vitest';
import { LeaveOutFormSchema } from './LeaveOutFormSchema';

describe('LeaveOutFormSchema', () => {
  it('takes a note, trimmed, or none where nothing was written', () => {
    expect(LeaveOutFormSchema.parse({ note: ' Stutters ' })).toEqual({ note: 'Stutters' });
    expect(LeaveOutFormSchema.parse({ note: '   ' })).toEqual({ note: null });
  });

  it('keeps a note short enough to read in a list', () => {
    expect(LeaveOutFormSchema.safeParse({ note: 'a'.repeat(201) }).success).toBe(false);
  });
});
