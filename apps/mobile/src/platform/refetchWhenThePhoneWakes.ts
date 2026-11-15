import { AppState } from 'react-native';
import { addNetworkStateListener } from 'expo-network';
import { focusManager, onlineManager } from '@tanstack/react-query';

/**
 * Tells the query cache when the app comes back from the background and when the phone comes back
 * online, so what was showing is asked for again, without a glance at the notifications or the
 * control centre counting as leaving.
 */
const refetchWhenThePhoneWakes = (): void => {
  focusManager.setEventListener((isFocused) => {
    const watching = AppState.addEventListener('change', (state) => {
      isFocused(state !== 'background');
    });

    return () => {
      watching.remove();
    };
  });

  onlineManager.setEventListener((isOnline) => {
    const watching = addNetworkStateListener((state) => {
      isOnline(state.isConnected !== false);
    });

    return () => {
      watching.remove();
    };
  });
};

export { refetchWhenThePhoneWakes };
