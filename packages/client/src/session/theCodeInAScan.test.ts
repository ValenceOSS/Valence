import { describe, expect, it } from 'vitest';
import { theCodeInAScan } from './theCodeInAScan';

describe('the code in a scanned QR code', () => {
  it('takes the code a television carries in the address it shows', () => {
    expect(theCodeInAScan('http://192.168.1.20:8420/device?user_code=ABCD1234')).toBe('ABCD1234');
  });

  it('tidies it into the shape the server issued it in', () => {
    expect(theCodeInAScan('https://valence.example/device?user_code=abcd-1234')).toBe('ABCD1234');
  });

  it('takes a code on its own as it is', () => {
    expect(theCodeInAScan(' abcd-1234 ')).toBe('ABCD1234');
  });

  it('finds nothing in an address that carries no code', () => {
    expect(theCodeInAScan('https://example.com/menu')).toBeNull();
  });

  it('finds nothing in nothing', () => {
    expect(theCodeInAScan('  ')).toBeNull();
  });
});
