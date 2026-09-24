import { View } from 'react-native';
import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { AGlassProps, NativeGlassProps } from './AGlass.types';

const TheGlass = requireNativeView<NativeGlassProps>('ValenceGlass');

const FILLS = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
} as const satisfies NativeGlassProps['style'];

/**
 * The system's liquid glass, filling whatever holds it, for a control drawn over it to sit on.
 * Only asked for on a phone that has liquid glass.
 *
 * @param roundness - How round its corners are.
 * @param tint - A colour to tint it, as a chosen control is.
 * @param isShown - Whether it is there, easing in and out when that changes.
 */
const AGlass = ({ roundness, tint, isShown = true }: AGlassProps) => {
  const colours = useTheColours();

  return drawsNatively() ? (
    <TheGlass
      roundness={roundness}
      isShown={isShown}
      {...(tint === undefined ? {} : { tint })}
      style={FILLS}
      pointerEvents="none"
    />
  ) : (
    <View
      style={[
        FILLS,
        {
          backgroundColor: tint ?? withAlpha(colours.surfaceRaised, 0.92),
          borderRadius: roundness,
          opacity: isShown ? 1 : 0,
        },
      ]}
      pointerEvents="none"
    />
  );
};

AGlass.displayName = 'AGlass';

export { AGlass };
