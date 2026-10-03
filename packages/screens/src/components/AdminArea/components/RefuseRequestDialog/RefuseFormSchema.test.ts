import { describe, expect, it } from 'vitest';
import { RefuseFormSchema } from './RefuseFormSchema';

describe('RefuseFormSchema', () => {
  it('takes a reason, trimmed, or none at all', () => {
    expect(RefuseFormSchema.parse({ reason: ' Already on the server ' })).toEqual({
      reason: 'Already on the server',
    });
    expect(RefuseFormSchema.parse({ reason: '' })).toEqual({ reason: '' });
  });
});
