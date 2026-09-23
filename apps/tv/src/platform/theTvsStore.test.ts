import * as SecureStore from 'expo-secure-store';
import { theTvsStore } from '@ValenceTv/platform/theTvsStore';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('theTvsStore', () => {
  it('keeps a value in the keychain and reads it back', () => {
    theTvsStore().write('valence.test.kept', 'http://valence.local');

    expect(theTvsStore().read('valence.test.kept')).toBe('http://valence.local');
  });

  it('reads nothing for a key it never kept', () => {
    expect(theTvsStore().read('valence.test.never')).toBeNull();
  });

  it('forgets a key at once, before the keychain has', async () => {
    const store = theTvsStore();

    store.write('valence.test.forgotten', 'here');
    store.forget('valence.test.forgotten');

    expect(store.read('valence.test.forgotten')).toBeNull();

    await Promise.resolve();

    expect(theTvsStore().read('valence.test.forgotten')).toBeNull();
  });

  it('reads nothing where the keychain cannot be read', () => {
    jest.spyOn(SecureStore, 'getItem').mockImplementation(() => {
      throw new Error('locked');
    });

    expect(theTvsStore().read('valence.test.locked')).toBeNull();
  });

  it('still holds a value the keychain would not take', () => {
    jest.spyOn(SecureStore, 'setItem').mockImplementation(() => {
      throw new Error('locked');
    });

    const store = theTvsStore();

    store.write('valence.test.refused', 'value');

    expect(store.read('valence.test.refused')).toBe('value');
  });

  it('does not mind the keychain failing to forget', async () => {
    jest
      .spyOn(SecureStore, 'deleteItemAsync')
      .mockImplementation(() => Promise.reject(new Error('locked')));

    const store = theTvsStore();

    store.forget('valence.test.stuck');

    await Promise.resolve();

    expect(store.read('valence.test.stuck')).toBeNull();
  });
});
