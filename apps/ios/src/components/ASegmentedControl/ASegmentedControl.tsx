import { requireNativeView } from 'expo';
import { z } from 'zod';
import { theColours } from '@ValencePhone/theme/theColours';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type {
  ASegmentedControlProps,
  NativeSegmentedControlProps,
} from './ASegmentedControl.types';

const TheControl = requireNativeView<NativeSegmentedControlProps>('ValenceSegmentedControl');

const ChosenSchema = z.object({ index: z.number().int() });

const HIGH = { height: 36 } as const;

/**
 * One choice out of a few, drawn by iOS itself as it draws that choice in every other app: its
 * segmented control, on liquid glass that slides between the choices from iOS 26, in the app's own
 * typeface and light or dark as the app is.
 *
 * @param label - What is being chosen, for anyone who cannot see it.
 * @param items - What there is to choose from.
 * @param value - Which one is picked, or none yet.
 * @param onSelect - Told which one somebody picked.
 */
const ASegmentedControl = ({ label, items, value, onSelect }: ASegmentedControlProps) => {
  const colours = useTheColours();

  return (
    <TheControl
      labels={items.map((item) => item.label)}
      picked={items.findIndex((item) => item.id === value)}
      isDark={colours.surface === theColours.dark.surface}
      accessibilityLabel={label}
      style={HIGH}
      onChoose={(event) => {
        const chosen = ChosenSchema.safeParse(event.nativeEvent);
        const item = chosen.success ? items[chosen.data.index] : undefined;

        if (item !== undefined && item.id !== value) {
          onSelect(item.id);
        }
      }}
    />
  );
};

ASegmentedControl.displayName = 'ASegmentedControl';

export { ASegmentedControl };
