import { View } from 'react-native';
import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import type { ABlurProps, NativeBlurProps } from './ABlur.types';

const TheBlur = requireNativeView<NativeBlurProps>('ValenceBlur');

const FILLS = {
  bottom: 0,
  left: 0,
  position: 'absolute',
  right: 0,
  top: 0,
} as const satisfies NativeBlurProps['style'];

/**
 * An even blur over whatever is behind it, filling whatever holds it, dark or light to match the
 * page. It comes and goes by growing and fading the blur itself, since fading a blur's view draws it
 * wrongly until it is fully there.
 *
 * @param isDark - Whether the page is dark.
 * @param isOn - Whether it is blurring, which it moves to over time.
 * @param changesOver - How long it takes to come or go, in milliseconds.
 */
const ABlur = ({ isDark, isOn = true, changesOver = 900 }: ABlurProps) =>
  drawsNatively() ? (
    <TheBlur
      isDark={isDark}
      isOn={isOn}
      changesOver={changesOver / 1000}
      style={FILLS}
      pointerEvents="none"
    />
  ) : (
    <View
      style={[
        FILLS,
        {
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.72)' : 'rgba(255, 255, 255, 0.78)',
          opacity: isOn ? 1 : 0,
        },
      ]}
      pointerEvents="none"
    />
  );

ABlur.displayName = 'ABlur';

export { ABlur };
