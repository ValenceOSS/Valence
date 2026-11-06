import { useEffect, useState } from 'react';
import { cardTintOf } from '@ValenceCore/functions/cardTintOf';
import { readLights } from '@ValenceScreens/library/readLights';
import { useIsDarkPage } from '@ValenceScreens/library/useIsDarkPage';

/**
 * The colour a title's dialog is tinted with on a dark page, as the phone tints a title's page:
 * read off the foot of its backdrop, where the picture fades into the dialog, and deepened into a
 * ground to write on.
 *
 * @param url - The backdrop to read, or nothing while there is none.
 * @returns The tint, or nothing on a light page or where the picture gave no colour.
 */
const useArtworkTint = (url: string | null): string | null => {
  const [tint, setTint] = useState<string | null>(null);
  const isDark = useIsDarkPage();

  useEffect(() => {
    if (url === null || !isDark) {
      setTint(null);

      return;
    }

    let isCurrent = true;
    const picture = new Image();

    picture.crossOrigin = 'anonymous';
    picture.src = url;
    picture
      .decode()
      .then(() => {
        if (isCurrent) {
          setTint(
            cardTintOf(
              readLights(picture).map((light) => ({ colour: light.color, at: light.at ?? '' })),
            ),
          );
        }
      })
      .catch(() => {
        if (isCurrent) {
          setTint(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [url, isDark]);

  return tint;
};

export { useArtworkTint };
