import { useMenuButton } from '@ValenceTv/navigation/useMenuButton';
import type { useMenuToClose as onTheTelevision } from '@ValenceTv/navigation/useMenuToClose';

/**
 * Takes the remote's Back button to close something open over a screen in a television's browser,
 * which hears Back the same way whatever lies beneath.
 *
 * @param onClose - What closing does.
 */
const useMenuToClose: typeof onTheTelevision = (onClose) => {
  useMenuButton(onClose);
};

export { useMenuToClose };
