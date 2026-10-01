import { describe, expect, it } from 'vitest';
import { ArrAcknowledgementSchema } from './ArrAcknowledgementSchema';

describe('ArrAcknowledgementSchema', () => {
  it('takes any answer at all, nothing included', () => {
    expect(ArrAcknowledgementSchema.parse(null)).toBeNull();
    expect(ArrAcknowledgementSchema.parse([{ id: 1, monitored: true }])).toEqual([
      { id: 1, monitored: true },
    ]);
  });
});
