import { randomUUID } from 'expo-crypto';
import { giveThisPhoneCrypto } from './giveThisPhoneCrypto';

const withoutCrypto = () => {
  Reflect.deleteProperty(globalThis, 'crypto');
};

const theCrypto = (): typeof globalThis.crypto | undefined =>
  'crypto' in globalThis ? crypto : undefined;

jest.mock('expo-crypto');

describe('giveThisPhoneCrypto', () => {
  it('gives a phone that has none the one everything asks for', () => {
    withoutCrypto();

    giveThisPhoneCrypto();

    expect(typeof theCrypto()?.randomUUID).toBe('function');
    expect(typeof theCrypto()?.getRandomValues).toBe('function');
  });

  it('asks the phone itself for randomness, rather than making some up', () => {
    withoutCrypto();
    jest.mocked(randomUUID).mockReturnValue('3fa85f64-5717-4562-b3fc-2c963f66afa6');

    giveThisPhoneCrypto();

    expect(theCrypto()?.randomUUID()).toBe('3fa85f64-5717-4562-b3fc-2c963f66afa6');
  });

  it('leaves alone a client that already has one', () => {
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: { randomUUID: () => 'the-one-already-here' },
    });

    giveThisPhoneCrypto();

    expect(theCrypto()?.randomUUID()).toBe('the-one-already-here');
  });
});
