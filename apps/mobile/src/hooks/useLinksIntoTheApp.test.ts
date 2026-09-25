import { renderHook } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { useLinksIntoTheApp } from './useLinksIntoTheApp';

const [[, arrived] = []] = jest.mocked(Linking).addEventListener.mock.calls;

/**
 * Hands the app a link, as the phone does when something opens it while it is running.
 *
 * @param url - The link.
 */
const arrive = (url: string) => {
  arrived?.({ url });
};

describe('useLinksIntoTheApp', () => {
  it('keeps a link that arrived before anybody was listening, such as while signing in', async () => {
    const onLink = jest.fn();

    arrive('valence://device?user_code=WXYZ9876');

    await renderHook(() => {
      useLinksIntoTheApp(onLink);
    });

    expect(onLink).toHaveBeenCalledWith({ kind: 'device', code: 'WXYZ9876', server: null });
  });

  it('follows a link that arrives while it is listening, and follows it only once', async () => {
    const onLink = jest.fn();

    await renderHook(() => {
      useLinksIntoTheApp(onLink);
    });

    arrive('valence://open?server=once');
    arrive('valence://open?server=once');

    expect(onLink).toHaveBeenCalledTimes(1);
  });

  it('leaves a link that is not one of its own alone', async () => {
    const onLink = jest.fn();

    await renderHook(() => {
      useLinksIntoTheApp(onLink);
    });

    arrive('valence://signed-in?code=abc');

    expect(onLink).not.toHaveBeenCalled();
  });
});
