import type { View } from 'react-native';
import type { Spot } from '@ValenceTv/components/Flight/Flight.types';

/**
 * Where a view is drawn on the screen, as its corner and its size.
 *
 * @param view - The view.
 * @returns Where it is, once it has been laid out.
 */
const whereOnScreen = (view: View): Promise<Spot> =>
  new Promise((resolve) => {
    view.measureInWindow((x, y, width, height) => {
      resolve({ x, y, width, height });
    });
  });

export { whereOnScreen };
