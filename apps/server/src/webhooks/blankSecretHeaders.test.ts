import { describe, expect, it } from 'vitest';
import { blankSecretHeaders } from './blankSecretHeaders';

describe('blankSecretHeaders', () => {
  it('empties only the headers marked secret', () => {
    expect(
      blankSecretHeaders({
        method: 'POST',
        format: 'json',
        template: '{}',
        headers: [
          { name: 'Authorization', value: 'Bearer token', isSecret: true },
          { name: 'X-Source', value: 'valence', isSecret: false },
        ],
        isSigned: true,
      })?.headers,
    ).toStrictEqual([
      { name: 'Authorization', value: '', isSecret: true },
      { name: 'X-Source', value: 'valence', isSecret: false },
    ]);
  });

  it('is nothing for a webhook with no Custom setup', () => {
    expect(blankSecretHeaders(null)).toBeNull();
  });
});
