import { useCallback, useMemo, useState } from 'react';
import { useVideoPlayer } from 'expo-video';
import type { VideoSource } from 'expo-video';
import type { AClipPlayer } from '@ValenceMobile/components/APreview/APreview.types';

/**
 * One player for clips, shared by every preview that may play in it so only one is ever made: each
 * loads its own clip into it when its turn comes, and lets it go only while it is still its own,
 * so a preview giving way cannot unload the one that came after it.
 *
 * @returns The player, the clip it holds, and the ways to load a clip into it and let one go.
 */
const useClipPlayer = (): AClipPlayer => {
  const [source, setSource] = useState<VideoSource | null>(null);
  const player = useVideoPlayer(source, (made) => {
    made.muted = true;
    made.loop = false;
  });
  const load = useCallback((next: VideoSource) => {
    setSource(next);
  }, []);
  const letGo = useCallback((mine: VideoSource) => {
    setSource((held) => (held === mine ? null : held));
  }, []);

  return useMemo(() => ({ player, source, load, letGo }), [player, source, load, letGo]);
};

export { useClipPlayer };
