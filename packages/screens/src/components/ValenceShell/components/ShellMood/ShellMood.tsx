import { MoodBackground } from '@ValenceUI/MoodBackground';
import { useHomeLights } from '@ValenceScreens/library/homeLights';
import { useMusicLights } from '@ValenceScreens/music/musicLights';
import { useLiveLights } from '@ValenceScreens/library/liveLights';
import type { ShellMoodProps } from './ShellMood.types';

/**
 * The lights behind the shell, in the colours of the film at the front of the home page, of the
 * album on screen in music, or of the channel playing in live TV, and the house's own everywhere
 * else.
 *
 * It reads the lights itself rather than being handed them, so that they changing, as they do
 * several times a second while a trailer plays, redraws the lights and nothing else.
 *
 * @param section - Which section is showing, which decides whose lights these are.
 */
const ShellMood = ({ section }: ShellMoodProps) => {
  const homeLights = useHomeLights();
  const musicLights = useMusicLights();
  const liveLights = useLiveLights();

  return (
    <MoodBackground
      lights={
        section === 'home'
          ? [...homeLights]
          : section === 'music'
            ? [...musicLights]
            : section === 'live'
              ? [...liveLights]
              : []
      }
    />
  );
};

ShellMood.displayName = 'ShellMood';

export { ShellMood };
