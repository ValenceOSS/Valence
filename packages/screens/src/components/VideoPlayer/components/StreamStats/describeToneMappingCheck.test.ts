import { describe, expect, it } from 'vitest';
import { describeToneMappingCheck } from './describeToneMappingCheck';

describe('describeToneMappingCheck', () => {
  it('says the check passed', () => {
    expect(describeToneMappingCheck({ outcome: 'trusted' }, 'hevc')).toBe('Passed its check');
  });

  it('says the browser changed the test grey, with the value that came back', () => {
    expect(describeToneMappingCheck({ outcome: 'changed', grey: 97 }, 'hevc')).toBe(
      'Not used: its test grey came back as 97, not 128',
    );
  });

  it('names the codec WebCodecs would not decode', () => {
    expect(describeToneMappingCheck({ outcome: 'notDecodable' }, 'hevc')).toBe(
      'Not used: WebCodecs won’t decode 10-bit hevc',
    );
  });

  it('says WebGPU was missing, the test frame did not decode, or the check threw', () => {
    expect(describeToneMappingCheck({ outcome: 'noWebGpu' }, 'hevc')).toBe(
      'Not used: WebGPU isn’t available',
    );
    expect(describeToneMappingCheck({ outcome: 'notDecoded' }, 'hevc')).toBe(
      'Not used: its test frame didn’t decode',
    );
    expect(describeToneMappingCheck({ outcome: 'failed', reason: 'device lost' }, 'hevc')).toBe(
      'Not used: its check failed (device lost)',
    );
  });
});
