import { ActionSheetIOS } from 'react-native';

/**
 * Offers the versions of a title in the system's action sheet, as the web offers them in a menu,
 * and tells whoever asked which was picked.
 *
 * @param versions - Each version's id and name, the original first.
 * @param onChoose - Told the id of the one picked.
 */
const askWhichVersion = (
  versions: readonly { id: string; label: string }[],
  onChoose: (id: string) => void,
): void => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title: 'Which version to play',
      options: [...versions.map((one) => one.label), 'Cancel'],
      cancelButtonIndex: versions.length,
    },
    (picked) => {
      const chosen = versions[picked];

      if (chosen !== undefined) {
        onChoose(chosen.id);
      }
    },
  );
};

export { askWhichVersion };
