import { requireNativeView } from 'expo';
import { drawsNatively } from '@ValenceMobile/platform/drawsNatively';
import type { NativeVolumeProps } from '@ValenceMobile/platform/thePhonesVolume.types';

const TheSystemSlider = requireNativeView<NativeVolumeProps>('ValenceVolume');

const OUT_OF_SIGHT = { height: 1, left: 0, position: 'absolute', top: 0, width: 1 } as const;

/**
 * The system's own volume slider, all but invisible, which an iPhone needs on screen for the app to
 * set its volume, and which keeps iOS from drawing its volume box when the buttons on the side are
 * pressed. Nothing anywhere else.
 */
const TheSystemVolume = () => (drawsNatively() ? <TheSystemSlider style={OUT_OF_SIGHT} /> : null);

TheSystemVolume.displayName = 'TheSystemVolume';

export { TheSystemVolume };
