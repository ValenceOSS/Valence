import { describe, expect, it } from 'vitest';
import { strictestStreamLimit } from './strictestStreamLimit';

describe('strictestStreamLimit', () => {
  it('takes the lowest ceiling set on each side', () => {
    expect(
      strictestStreamLimit([
        { maxBitrateKbps: 20_000, maxStreams: null },
        { maxBitrateKbps: 8000, maxStreams: 3 },
        { maxBitrateKbps: null, maxStreams: 2 },
      ]),
    ).toEqual({ maxBitrateKbps: 8000, maxStreams: 2 });
  });

  it('leaves a side open where nobody set one', () => {
    expect(strictestStreamLimit([])).toEqual({ maxBitrateKbps: null, maxStreams: null });
  });
});
