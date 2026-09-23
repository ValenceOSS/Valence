import { describe, expect, it } from 'vitest';
import { anAddressAPhoneCanReach } from './anAddressAPhoneCanReach';

describe('where to tell a phone to go', () => {
  it('sends it to the address this screen reached Valence on', () => {
    expect(
      anAddressAPhoneCanReach('http://localhost:8420/device', 'http://valence.local:8420'),
    ).toBe('http://valence.local:8420/device');
  });

  it('keeps the code the server put on the address', () => {
    expect(
      anAddressAPhoneCanReach(
        'http://localhost:8420/device?user_code=ABCD1234',
        'http://valence.local:8420',
      ),
    ).toBe('http://valence.local:8420/device?user_code=ABCD1234');
  });

  it('keeps a path an operator configured, rather than assuming where it goes', () => {
    expect(anAddressAPhoneCanReach('https://example.test/link/tv', 'https://valence.example')).toBe(
      'https://valence.example/link/tv',
    );
  });

  it('follows the scheme this page was served over, not the one the server claimed', () => {
    expect(anAddressAPhoneCanReach('http://localhost:8420/device', 'https://valence.example')).toBe(
      'https://valence.example/device',
    );
  });

  it('says what the server said where there is nothing to read', () => {
    expect(anAddressAPhoneCanReach('not an address', 'http://valence.local')).toBe(
      'not an address',
    );
  });
});
