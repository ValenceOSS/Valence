import { AppState } from 'react-native';
import { focusManager } from '@tanstack/react-query';
import { refetchWhenThePhoneWakes } from './refetchWhenThePhoneWakes';

describe('refetchWhenThePhoneWakes', () => {
  it('counts the app coming back to the front as the page being looked at again', () => {
    const listening = jest.spyOn(AppState, 'addEventListener');

    refetchWhenThePhoneWakes();
    focusManager.setFocused(undefined);

    const told = listening.mock.calls[0]?.[1];

    told?.('background');
    expect(focusManager.isFocused()).toBe(false);

    told?.('active');
    expect(focusManager.isFocused()).toBe(true);
  });

  it('does not count a glance at the notifications as leaving, so nothing is asked again', () => {
    const listening = jest.spyOn(AppState, 'addEventListener');
    const refocused = jest.fn();

    refetchWhenThePhoneWakes();
    focusManager.setFocused(true);

    const stopListening = focusManager.subscribe(refocused);
    const told = listening.mock.calls.at(-1)?.[1];

    told?.('inactive');
    told?.('active');

    expect(focusManager.isFocused()).toBe(true);
    expect(refocused).not.toHaveBeenCalled();
    stopListening();
  });
});
