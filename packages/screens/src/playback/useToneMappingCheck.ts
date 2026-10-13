import { useEffect, useState } from 'react';
import type { ToneMappingCheck } from '@ValenceClient/playback/ToneMappingCheck';
import { readEngineSupport } from '@ValenceScreens/playback/readEngineSupport';

/**
 * Says how Valence's own tone mapping check went in this browser for a codec, from what the player
 * already asked of the browser and keeps for the life of the page, so the player can say why it
 * left HDR to the browser.
 *
 * @param codec - The film's picture codec, as Valence names it, or null where it is not known.
 * @param isEnabled - Whether to ask at all, for a film that is not HDR or a screen that shows HDR.
 * @returns How the check went, or null until it is known or where the codec was never checked.
 */
const useToneMappingCheck = (codec: string | null, isEnabled: boolean): ToneMappingCheck | null => {
  const [check, setCheck] = useState<ToneMappingCheck | null>(null);

  useEffect(() => {
    if (!isEnabled || codec === null) {
      setCheck(null);

      return;
    }

    let isCurrent = true;

    void readEngineSupport()
      .then((support) => {
        if (isCurrent) {
          setCheck(support.toneMappingChecks[codec] ?? null);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setCheck(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [codec, isEnabled]);

  return check;
};

export { useToneMappingCheck };
