import { View } from 'react-native';
import type { EdgeFadeProps } from './EdgeFade.types';

/**
 * Holds a picture that a television fades out towards one edge, unfaded in a television's browser.
 *
 * The fade is a mask, which a browser redraws for the whole picture every time anything under it
 * changes, and a large one over the hero and the title pages cost the TV layout frames on an LG set.
 *
 * @param style - Its size and place.
 * @param children - The picture.
 */
const EdgeFade = ({ style, children }: EdgeFadeProps) => <View style={style}>{children}</View>;

EdgeFade.displayName = 'EdgeFade';

export { EdgeFade };
