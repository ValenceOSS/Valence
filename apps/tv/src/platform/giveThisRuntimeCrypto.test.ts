import { getRandomValues, randomUUID } from 'expo-crypto';
import { giveThisRuntimeCrypto } from '@ValenceTv/platform/giveThisRuntimeCrypto';

jest.mock('expo-crypto', () => ({
  getRandomValues: jest.fn(),
  randomUUID: jest.fn(() => '00000000-0000-4000-8000-000000000001'),
}));

const theRuntimes = Object.getOwnPropertyDescriptor(globalThis, 'crypto');

afterEach(() => {
  if (theRuntimes === undefined) {
    Reflect.deleteProperty(globalThis, 'crypto');
  } else {
    Object.defineProperty(globalThis, 'crypto', theRuntimes);
  }
});

describe('giveThisRuntimeCrypto', () => {
  it('gives a runtime without crypto the system random source', () => {
    Reflect.deleteProperty(globalThis, 'crypto');

    giveThisRuntimeCrypto();

    expect(Reflect.get(globalThis, 'crypto')).toEqual({ getRandomValues, randomUUID });
    expect(globalThis.crypto.randomUUID()).toBe('00000000-0000-4000-8000-000000000001');
  });

  it('leaves a runtime that has crypto with its own', () => {
    const own = { randomUUID: () => 'own' };

    Object.defineProperty(globalThis, 'crypto', { value: own, configurable: true, writable: true });

    giveThisRuntimeCrypto();

    expect(Reflect.get(globalThis, 'crypto')).toBe(own);
  });
});
