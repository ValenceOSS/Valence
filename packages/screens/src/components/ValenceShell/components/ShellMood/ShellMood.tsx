import { MoodBackground } from '@ValenceUI/MoodBackground';
import { useHomeLights } from '@ValenceScreens/library/homeLights';
import { useLiveLights } from '@ValenceScreens/library/liveLights';
import type { ShellMoodProps } from './ShellMood.types';

/**
 * The lights behind the shell, in the colours of the film at the front of the home page or of the
 * channel playing in live TV, and the house's own everywhere else. Music has none, so its top bar
 * stays flat: the page there is lit by its own artwork, beneath the bar.
 *
 * It reads the lights itself rather than being handed them, so that they changing, as they do
 * several times a second while a trailer plays, redraws the lights and nothing else.
 *
 * @param section - Which section is showing, which decides whose lights these are.
 */
const ShellMood = ({ section }: ShellMoodProps) => {
  const homeLights = useHomeLights();
  const liveLights = useLiveLights();

  if (section === 'music') {
    return null;
  }

  return (
    <MoodBackground
      lights={section === 'home' ? [...homeLights] : section === 'live' ? [...liveLights] : []}
    />
  );
};

ShellMood.displayName = 'ShellMood';

export { ShellMood };
