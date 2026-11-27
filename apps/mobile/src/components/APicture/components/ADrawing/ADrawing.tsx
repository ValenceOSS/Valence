import { SvgXml } from 'react-native-svg';
import { useDrawing } from '@ValenceClient/profiles/useDrawing';
import type { ADrawingProps } from './ADrawing.types';

/**
 * A face the server draws as a vector, filling whatever holds it.
 *
 * What the server sent is kept while the app is open, so the same face drawn again — the wall of
 * faces coming back from the password — is drawn at once rather than fetched again, which left its
 * tile empty for the moment the fetch took.
 *
 * @param uri - Where the drawing is.
 * @param onMissing - Told it could not be read.
 * @param onLoad - Told it has been read and drawn.
 */
const ADrawing = ({ uri, onMissing, onLoad }: ADrawingProps) => {
  const xml = useDrawing(uri, { onLoad, onMissing });

  return xml === null ? null : <SvgXml xml={xml} width="100%" height="100%" />;
};

ADrawing.displayName = 'ADrawing';

export { ADrawing };
