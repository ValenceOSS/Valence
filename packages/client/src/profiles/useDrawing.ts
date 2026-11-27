import { useEffect, useRef, useState } from 'react';
import { DRAWINGS } from '@ValenceClient/profiles/DRAWINGS';

/**
 * Reads a face the server draws as a vector, for a client that draws it rather than hands it to an
 * image loader, which cannot read one.
 *
 * What the server sent is kept while the app is open, so the same face drawn again is drawn at once
 * rather than fetched again, which leaves its tile empty for the moment the fetch takes.
 *
 * @param uri - Where the drawing is.
 * @param told - Told once it has been read, or that it could not be.
 * @returns The drawing's markup, or nothing until it has been read.
 */
const useDrawing = (
  uri: string,
  told: { onLoad?: (() => void) | undefined; onMissing: () => void },
): string | null => {
  const [drawn, setDrawn] = useState<{ uri: string; xml: string } | null>(() => {
    const kept = DRAWINGS.get(uri);

    return kept === undefined ? null : { uri, xml: kept };
  });
  const listening = useRef(told);

  useEffect(() => {
    listening.current = told;
  }, [told]);

  useEffect(() => {
    const kept = DRAWINGS.get(uri);

    if (kept !== undefined) {
      listening.current.onLoad?.();

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
          listening.current.onLoad?.();
        }
      })
      .catch(() => {
        if (isStill) {
          listening.current.onMissing();
        }
      });

    return () => {
      isStill = false;
    };
  }, [uri]);

  return drawn?.uri === uri ? drawn.xml : (DRAWINGS.get(uri) ?? null);
};

export { useDrawing };
