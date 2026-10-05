import { fireEvent } from '@testing-library/react-native';
import { theMenu } from '@ValenceMobile/testing/theMenu';

/**
 * Chooses from a system pop-up menu as somebody picking from it would.
 *
 * @param label - What the menu chooses.
 * @param chosen - The id of the choice picked.
 */
const chooseFromTheMenu = async (label: string, chosen: string): Promise<void> => {
  await fireEvent(theMenu(label), 'selectionChange', { nativeEvent: { selection: chosen } });
};

export { chooseFromTheMenu };
