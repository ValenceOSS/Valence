import { AppState } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { tellQueriesWhenOnScreen } from '@ValenceTv/platform/tellQueriesWhenOnScreen';
import type { AppStateStatus } from 'react-native';

const remove = jest.fn();

let heard: ((state: AppStateStatus) => void) | null = null;

beforeEach(() => {
  heard = null;
  remove.mockClear();
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
    heard = listener;

    return { remove };
  });
});

afterEach(() => {
  focusManager.setEventListener(() => undefined);
  focusManager.setFocused(undefined);
  jest.restoreAllMocks();
});

describe('tellQueriesWhenOnScreen', () => {
  it('tells the cache when the app leaves the screen and comes back', () => {
    tellQueriesWhenOnScreen();

    heard?.('background');

    expect(focusManager.isFocused()).toBe(false);

    heard?.('active');

    expect(focusManager.isFocused()).toBe(true);
  });

  it('stops listening when the cache is told some other way', () => {
    tellQueriesWhenOnScreen();
    focusManager.setEventListener(() => undefined);

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
