import AsyncStorage from '@react-native-async-storage/async-storage';
import { thePhonesStore } from './thePhonesStore';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('thePhonesStore', () => {
  it('answers at once from what was read at startup', () => {
    const store = thePhonesStore(new Map([['valence.theme', 'dark']]));

    expect(store.read('valence.theme')).toBe('dark');
  });

  it('answers nothing for what it was never told', () => {
    expect(thePhonesStore(new Map()).read('valence.theme')).toBeNull();
  });

  it('lets a preference be set and read in the same breath', () => {
    const store = thePhonesStore(new Map());

    store.write('valence.theme', 'light');

    expect(store.read('valence.theme')).toBe('light');
  });

  it('writes through to the storage behind it', async () => {
    thePhonesStore(new Map()).write('valence.theme', 'light');

    await expect(AsyncStorage.getItem('valence.theme')).resolves.toBe('light');
  });

  it('forgets in both places', async () => {
    const store = thePhonesStore(new Map([['valence.theme', 'dark']]));

    await AsyncStorage.setItem('valence.theme', 'dark');
    store.forget('valence.theme');

    expect(store.read('valence.theme')).toBeNull();
    await expect(AsyncStorage.getItem('valence.theme')).resolves.toBeNull();
  });
});
