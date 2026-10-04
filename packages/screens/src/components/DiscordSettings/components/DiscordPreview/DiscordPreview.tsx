import { useState } from 'react';
import { Shuffle as ShuffleIcon } from '@keyline-icons/react';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { DiscordStatusCard } from '@ValenceUI/DiscordStatusCard';
import { PanelCard } from '@ValenceScreens/components/PanelCard/PanelCard';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { useDiscordSamples } from './useDiscordSamples';
import { theDiscordPreview } from './theDiscordPreview';
import { theCardOf } from './theCardOf';
import type { PreviewState } from './theDiscordPreview';
import type { DiscordPreviewProps } from './DiscordPreview.types';
import { say } from '@ValenceI18n/say';

const STATES = [
  { id: 'film', label: say('common.film') },
  { id: 'episode', label: say('common.episode') },
  { id: 'music', label: say('common.music') },
  { id: 'paused', label: say('common.paused') },
  { id: 'party', label: say('common.partyMenu.watchParty') },
  { id: 'browsing', label: say('screens.discordPreview.browsing') },
] as const satisfies readonly { id: PreviewState; label: string }[];

/**
 * What somebody's Discord status would look like with the settings as they stand, before they are
 * saved: the card on their Discord profile, for each state in turn, with a real film, episode and
 * track from this server.
 *
 * It is built by the same steps that build the real status, so what it shows is what Discord would
 * be sent. The card is Valence's own drawing of Discord's, close but not exact.
 *
 * @param settings - The Discord settings as they would be saved.
 */
const DiscordPreview = ({ settings }: DiscordPreviewProps) => {
  const [state, setState] = useState<PreviewState>('film');
  const [now] = useState(Date.now);
  const samples = useDiscordSamples();
  const activity = theDiscordPreview(state, samples, settings, now);

  return (
    <PanelCard
      title={say('screens.mediaPreview.preview')}
      isFlush
      actions={
        <PanelCardAction icon={ShuffleIcon} onClick={samples.pickAgain}>
          {say('screens.discordPreview.randomisePreviewMedia')}
        </PanelCardAction>
      }
    >
      <div className="flex flex-col items-center gap-5 px-4 pb-5 pt-4">
        <SegmentedRow
          size="sm"
          tone="accent"
          label={say('screens.mediaPreview.preview')}
          items={STATES}
          value={state}
          onSelect={(chosen) => {
            setState(STATES.find((one) => one.id === chosen)?.id ?? 'film');
          }}
        />

        {activity === null ? (
          <p className="py-6 text-sm text-text-muted">
            {say('screens.discordPreview.nothingShowsOnDiscord')}
          </p>
        ) : (
          <DiscordStatusCard {...theCardOf(activity, now)} className="w-full max-w-[432px]" />
        )}
      </div>
    </PanelCard>
  );
};

DiscordPreview.displayName = 'DiscordPreview';

export { DiscordPreview };
