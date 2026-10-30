import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { readPictureTint } from '@ValenceTv/platform/readPictureTint';
import { tokens } from '@ValenceTv/theme/tokens';
import type { MoodBackdropProps } from './MoodBackdrop.types';

const SETTLES_AFTER_MS = 350;

/**
 * The ground behind every signed-in page in a television's browser: one deep colour taken from
 * whatever is featured, as a phone's card takes its tint, and the plain canvas where nothing is.
 *
 * On a television itself the page is lit by a blurred wash of whatever is featured, dissolving to
 * the next as focus moves. A browser draws that blur on the processor at full screen, again on
 * every change, which was a large part of why the TV layout dragged on an LG set. One colour costs
 * it a filled box. The colour is read only once the remote has settled, so running along a shelf
 * does not read every poster it passes; the last colour stays until the next is read, and it
 * changes at once rather than fading, since a fade runs a frame at a time in a browser.
 *
 * @param path - The picture whose colour tints the page, or nothing for the plain canvas.
 */
const MoodTinted = ({ path }: MoodBackdropProps) => {
  const [tint, setTint] = useState<string | null>(null);

  useEffect(() => {
    if (path === null) {
      return undefined;
    }

    let isStale = false;
    const settling = setTimeout(() => {
      void readPictureTint(path).then((colour) => {
        if (!isStale) {
          setTint(colour);
        }
      });
    }, SETTLES_AFTER_MS);

    return () => {
      isStale = true;
      clearTimeout(settling);
    };
  }, [path]);

  const ground = path === null ? null : tint;

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        styles.still,
        { backgroundColor: ground ?? tokens.colours.canvas },
      ]}
    />
  );
};

const styles = StyleSheet.create({ still: { pointerEvents: 'none' } });

const MoodBackdrop = memo(MoodTinted);

MoodBackdrop.displayName = 'MoodBackdrop';

export { MoodBackdrop };
