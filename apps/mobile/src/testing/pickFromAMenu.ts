import { fireEvent, screen } from '@testing-library/react-native';
import type { NativeMenuProps } from '@ValenceMobile/components/AMenu/AMenu.types';

/**
 * Presses one item of a menu that drops from what opened it, as somebody would once it is open.
 *
 * @param label - The item's words.
 */
const pickFromAMenu = async (label: string): Promise<void> => {
  for (const menu of screen.container.queryAll((one) => 'onChoose' in one.props)) {
    const { items = [] }: Partial<Pick<NativeMenuProps, 'items'>> = menu.props;
    const picked = items.find((item) => item.label === label);

    if (picked !== undefined) {
      await fireEvent(menu, 'choose', { nativeEvent: { id: picked.id } });

      return;
    }
  }

  throw new Error(`No menu item ${label} was drawn.`);
};

export { pickFromAMenu };
