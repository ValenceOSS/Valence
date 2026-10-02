import { describe, expect, it } from 'vitest';
import { parseSmtpFrom } from './parseSmtpFrom';

describe('parseSmtpFrom', () => {
  it('splits a name from its address', () => {
    expect(parseSmtpFrom('Valence <valence@example.com>')).toEqual({
      name: 'Valence',
      address: 'valence@example.com',
    });
    expect(parseSmtpFrom('"The Valence Server" <v@example.com>')).toEqual({
      name: 'The Valence Server',
      address: 'v@example.com',
    });
  });

  it('takes a bare address with no name', () => {
    expect(parseSmtpFrom(' valence@example.com ')).toEqual({
      name: '',
      address: 'valence@example.com',
    });
  });
});
