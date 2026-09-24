import AsyncStorage from '@react-native-async-storage/async-storage';
import { whatThePhoneRemembers } from './whatThePhoneRemembers';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('whatThePhoneRemembers', () => {
  it('reads everything the phone was told to keep', async () => {
    await AsyncStorage.setItem('valence.server.address', 'http://one.local:8420');
    await AsyncStorage.setItem('valence.theme', 'dark');

    const held = await whatThePhoneRemembers();

    expect(held.get('valence.server.address')).toBe('http://one.local:8420');
    expect(held.get('valence.theme')).toBe('dark');
  });

  it('leaves out what a paused download left to pick up from', async () => {
    await AsyncStorage.setItem('valence.theme', 'dark');
    await AsyncStorage.setItem('valence.held.resume.arrival', 'a great deal');

    const held = await whatThePhoneRemembers();

    expect(held.get('valence.theme')).toBe('dark');
    expect(held.has('valence.held.resume.arrival')).toBe(false);
  });

  it('starts empty on a phone that has been told nothing', async () => {
    await expect(whatThePhoneRemembers()).resolves.toEqual(new Map());
  });

  it('starts empty rather than refusing to start, where storage cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getAllKeys').mockRejectedValueOnce(new Error('no storage'));

    await expect(whatThePhoneRemembers()).resolves.toEqual(new Map());
  });
});
