import { screen } from '@testing-library/react-native';
import type { NativeMenuProps } from '@ValenceMobile/components/AMenu/AMenu.types';

/**
 * The items of every menu that drops from what opens it, in the order they are drawn.
 *
 * @returns Each item's words.
 */
const theAMenuItems = (): string[] =>
  screen.container
    .queryAll((one) => 'onChoose' in one.props)
    .flatMap((one) => {
      const { items = [] }: Partial<Pick<NativeMenuProps, 'items'>> = one.props;

      return items.map((item) => item.label);
    });

export { theAMenuItems };
