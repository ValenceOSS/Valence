import { useCallback, useMemo } from 'react';
import { usePlace } from '@ValenceScreens/navigation/usePlace';
import { readMusicView, writeMusicView } from '@ValenceClient/music/musicView';
import type { MusicView } from '@ValenceClient/music/musicView';

/**
 * Which part of the music section is showing, and a way to show another.
 *
 * Opening a view from anywhere — the player bar on the home page, a search result — goes to the
 * music section first, so a link to an album works wherever it is pressed.
 *
 * @returns The view, and a way to open one.
 */
const useMusicNavigation = (): { view: MusicView; open: (view: MusicView) => void } => {
  const { place, go } = usePlace();
  const view = useMemo(
    () => (place.section === 'music' ? readMusicView(place.listen) : readMusicView(null)),
    [place.section, place.listen],
  );

  const open = useCallback(
    (next: MusicView) => {
      go({ section: 'music', listen: writeMusicView(next) });
    },
    [go],
  );

  return { view, open };
};

export { useMusicNavigation };
