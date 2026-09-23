import { AppState } from 'react-native';
import { addNetworkStateListener } from 'expo-network';
import { focusManager, onlineManager } from '@tanstack/react-query';

/**
 * Tells the query cache when the app comes back to the front and when the phone comes back online,
 * which is what a browser tells it on its own and a phone does not, so what was showing is asked
 * for again rather than left as it was when somebody last looked.
 */
const refetchWhenThePhoneWakes = (): void => {
  focusManager.setEventListener((isFocused) => {
    const watching = AppState.addEventListener('change', (state) => {
      isFocused(state === 'active');
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
