import { useEffect } from 'react';
import { BackHandler, TVEventControl } from 'react-native';
import { menuKeyClaims } from '@ValenceTv/navigation/menuKeyClaims';

/**
 * Takes the remote's Menu button to close something open over a screen — a panel, a reader — while
 * it is open, whether or not the screen beneath holds the button itself.
 *
 * A part of the bar on an Apple TV leaves Menu to the system, which answers by leaving the app, so
 * whatever is open over it asks for the button while it is open and gives it back as it closes,
 * unless the screen beneath or something else still open over it is holding it.
 *
 * @param onClose - What closing does.
 */
const useMenuToClose = (onClose: () => void): void => {
  useEffect(() => {
    menuKeyClaims.overlays += 1;
    TVEventControl.enableTVMenuKey();

    const listening = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();

      return true;
    });

    return () => {
      listening.remove();
      menuKeyClaims.overlays -= 1;

      if (menuKeyClaims.overlays === 0 && !menuKeyClaims.isScreenHolding) {
        TVEventControl.disableTVMenuKey();
      }
    };
  }, [onClose]);
};

export { useMenuToClose };
