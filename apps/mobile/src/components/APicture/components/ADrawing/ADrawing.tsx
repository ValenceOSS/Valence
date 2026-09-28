import { useEffect, useRef, useState } from 'react';
import { SvgXml } from 'react-native-svg';
import { DRAWINGS } from '@ValenceMobile/components/APicture/components/ADrawing/DRAWINGS';
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
  const [drawn, setDrawn] = useState<{ uri: string; xml: string } | null>(() => {
    const kept = DRAWINGS.get(uri);

    return kept === undefined ? null : { uri, xml: kept };
  });
  const xml = drawn?.uri === uri ? drawn.xml : (DRAWINGS.get(uri) ?? null);
  const told = useRef({ onLoad, onMissing });

  useEffect(() => {
    told.current = { onLoad, onMissing };
  }, [onLoad, onMissing]);

  useEffect(() => {
    const kept = DRAWINGS.get(uri);

    if (kept !== undefined) {
      told.current.onLoad?.();

      return undefined;
    }

    let isStill = true;

    void fetch(uri)
      .then(async (answer) => {
        if (!answer.ok) {
          throw new Error(answer.statusText);
        }

        return answer.text();
      })
      .then((fetched) => {
        DRAWINGS.set(uri, fetched);

        if (isStill) {
          setDrawn({ uri, xml: fetched });
          told.current.onLoad?.();
        }
      })
      .catch(() => {
        if (isStill) {
          told.current.onMissing();
        }
      });

    return () => {
      isStill = false;
    };
  }, [uri]);

  return xml === null ? null : <SvgXml xml={xml} width="100%" height="100%" />;
};

ADrawing.displayName = 'ADrawing';

export { ADrawing };
