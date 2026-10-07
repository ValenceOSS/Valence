import { useEffect } from 'react';
import { View } from 'react-native';
import { useDrawnElement } from '@ValenceTv/web/useDrawnElement';
import type { EdgeFadeProps, FadeEdge } from './EdgeFade.types';

const TOWARDS_DEGREES: Record<FadeEdge, number> = { left: 90, right: 270, top: 180, bottom: 0 };

/**
 * Fades what it holds out to nothing towards one edge, for a television's browser, with a mask the
 * browser draws.
 *
 * @param edge - The edge it fades out towards.
 * @param reach - How far across, as a share of its size, it has fully faded in.
 * @param style - How it is laid out.
 * @param children - What is faded.
 */
const EdgeFade = ({ edge, reach, style, children }: EdgeFadeProps) => {
  const [element, drawn] = useDrawnElement();

  useEffect(() => {
    if (element === null) {
      return;
    }

    const mask = `linear-gradient(${TOWARDS_DEGREES[edge].toString()}deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) ${(reach * 100).toString()}%)`;

    element.style.setProperty('-webkit-mask-image', mask);
    element.style.setProperty('mask-image', mask);
  }, [element, edge, reach]);

  return (
    <View ref={drawn} style={style}>
      {children}
    </View>
  );
};

EdgeFade.displayName = 'EdgeFade';

export { EdgeFade };
