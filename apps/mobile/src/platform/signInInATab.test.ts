import { AppState, Linking } from 'react-native';
import { signInInATab } from './signInInATab';
import type { AppStateStatus } from 'react-native';

let linking = jest.spyOn(Linking, 'addEventListener');

let changing = jest.spyOn(AppState, 'addEventListener');

const onLink = (said: { url: string }): void => {
  linking.mock.calls.at(-1)?.[1](said);
};

const onChange = (now: AppStateStatus): void => {
  changing.mock.calls.at(-1)?.[1](now);
};

beforeEach(() => {
  jest.useFakeTimers();
  linking = jest.spyOn(Linking, 'addEventListener');
  changing = jest.spyOn(AppState, 'addEventListener');
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const opened = jest.fn(() => Promise.resolve());

describe('signInInATab', () => {
  it('opens the page in a tab and answers with where it sent the tab back to', async () => {
    const coming = signInInATab('https://valence.example/phone-sign-in', opened);

    onChange('background');
    onChange('active');
    onLink({ url: 'valence://signed-in?code=abc' });

    await expect(coming).resolves.toBe('valence://signed-in?code=abc');
    expect(opened).toHaveBeenCalledWith('https://valence.example/phone-sign-in');
  });

  it('takes coming back to the app with no link as having changed their mind', async () => {
    const coming = signInInATab('https://valence.example/phone-sign-in', opened);

    onChange('background');
    onChange('active');
    jest.advanceTimersByTime(1000);

    await expect(coming).resolves.toBeNull();
  });

  it('pays no mind to a link that is not a way back', async () => {
    const coming = signInInATab('https://valence.example/phone-sign-in', opened);

    onLink({ url: 'https://elsewhere.example' });
    onChange('background');
    onChange('active');
    onLink({ url: 'valence://signed-in?code=abc' });

    await expect(coming).resolves.toBe('valence://signed-in?code=abc');
  });

  it('refuses where the tab would not open', async () => {
    const coming = signInInATab('https://valence.example/phone-sign-in', () =>
      Promise.reject(new Error('no browser')),
    );

    await expect(coming).rejects.toThrow('The tab would not open.');
  });
});
