import { describe, expect, it } from 'vitest';
import { keepSecretHeaders } from './keepSecretHeaders';
import type { CustomWebhook } from '@ValenceContracts/schemas/Webhook';

const STORED: CustomWebhook = {
  method: 'POST',
  format: 'json',
  template: '{}',
  headers: [{ name: 'Authorization', value: 'Bearer token', isSecret: true }],
  isSigned: true,
};

describe('keepSecretHeaders', () => {
  it('keeps a secret that came back empty, matching its name in any case', () => {
    expect(
      keepSecretHeaders(
        { ...STORED, headers: [{ name: 'authorization', value: '', isSecret: true }] },
        STORED,
      ).headers,
    ).toStrictEqual([{ name: 'authorization', value: 'Bearer token', isSecret: true }]);
  });

  it('takes a secret that was typed again', () => {
    expect(
      keepSecretHeaders(
        { ...STORED, headers: [{ name: 'Authorization', value: 'Bearer new', isSecret: true }] },
        STORED,
      ).headers[0]?.value,
    ).toBe('Bearer new');
  });

  it('keeps a hidden value that comes back empty after being unhidden or renamed', () => {
    expect(
      keepSecretHeaders(
        { ...STORED, headers: [{ name: 'Authorization', value: '', isSecret: false }] },
        STORED,
      ).headers[0]?.value,
    ).toBe('Bearer token');
    expect(
      keepSecretHeaders(
        { ...STORED, headers: [{ name: 'X-Token', value: '', isSecret: true }] },
        STORED,
      ).headers[0]?.value,
    ).toBe('Bearer token');
  });

  it('keeps nothing for a header that was never hidden, or with nothing stored', () => {
    const shown = { ...STORED, headers: [{ name: 'X-Plain', value: 'a', isSecret: false }] };

    expect(
      keepSecretHeaders(
        { ...STORED, headers: [{ name: 'X-Plain', value: '', isSecret: false }] },
        shown,
      ).headers[0]?.value,
    ).toBe('');
    expect(keepSecretHeaders(STORED, null)).toStrictEqual(STORED);
  });
});
