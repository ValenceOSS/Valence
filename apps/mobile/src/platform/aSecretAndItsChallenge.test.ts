import { digestStringAsync, getRandomBytes } from 'expo-crypto';
import { aSecretAndItsChallenge } from './aSecretAndItsChallenge';

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytes: jest.fn(),
  digestStringAsync: jest.fn(),
}));

beforeEach(() => {
  jest.mocked(getRandomBytes).mockReset().mockReturnValue(new Uint8Array(32).fill(10));
  jest.mocked(digestStringAsync).mockReset().mockResolvedValue('the-challenge');
});

describe('aSecretAndItsChallenge', () => {
  it('makes the secret from thirty-two random bytes, written out in hex', async () => {
    const { secret } = await aSecretAndItsChallenge();

    expect(getRandomBytes).toHaveBeenCalledWith(32);
    expect(secret).toBe('0a'.repeat(32));
  });

  it('makes the challenge the sha-256 of the secret', async () => {
    const { challenge } = await aSecretAndItsChallenge();

    expect(digestStringAsync).toHaveBeenCalledWith('SHA-256', '0a'.repeat(32));
    expect(challenge).toBe('the-challenge');
  });
});
