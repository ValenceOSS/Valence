import { describe, expect, it } from 'vitest';
import { faultOf } from './faultOf';

describe('faultOf', () => {
  it('says where the engine failed and what the failure said', () => {
    expect(faultOf('decoding', new Error('Decoder failure'))).toEqual({
      stage: 'decoding',
      detail: 'Decoder failure',
    });
  });

  it('cuts every address to its origin, so a ticket in the path is never written down', () => {
    expect(
      faultOf(
        'opening',
        new Error(
          'Failed to fetch https://linked.example/api/federation/v1/direct/secret-ticket/file?x=1 (403)',
        ),
      ).detail,
    ).toBe('Failed to fetch https://linked.example (403)');
  });

  it('cuts a ticket from a path written without its origin', () => {
    expect(
      faultOf('opening', new Error('Could not read /api/federation/v1/direct/secret-ticket/file'))
        .detail,
    ).toBe('Could not read /api/federation/v1/direct/');
  });

  it('says nothing more where nothing said why', () => {
    expect(faultOf('refused', null)).toEqual({ stage: 'refused', detail: null });
    expect(faultOf('refused', { message: '  ' })).toEqual({ stage: 'refused', detail: null });
  });

  it('keeps the detail to the length a log line carries', () => {
    expect(faultOf('repackaging', new Error('x'.repeat(400))).detail).toHaveLength(300);
  });
});
