import { Badge } from '@ValenceUI/Badge';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SharedTimeline } from '@ValenceUI/SharedTimeline';
import { formatDuration } from '@ValenceCore/functions/formatDuration';
import { TOGETHER_WITHIN_SECONDS } from '@ValenceCore/functions/whoIsHoldingUp';
import { PARTY_WORDS } from '@ValenceClient/party/PARTY_WORDS';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';
import { ShowcaseFace } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/components/ShowcaseFace/ShowcaseFace';
import type { PartyPictureProps } from './PartyPicture.types';

const RUNS_FOR = 8080;

const ROOM_IS_AT = 5040;

const RUTH_IS_BEHIND_BY = 7;

const PEOPLE = ['Maya', 'Jonah', 'Ruth'] as const;

/**
 * The app's own watch party panel for three people on one film; Ruth has drifted behind until the
 * party brings her back into line on the one playhead.
 *
 * @param isInSync - Whether everybody is back together.
 */
const PartyPicture = ({ isInSync = false }: PartyPictureProps) => {
  const atOf = (name: string) =>
    name === 'Ruth' && !isInSync ? ROOM_IS_AT - RUTH_IS_BEHIND_BY : ROOM_IS_AT;

  return (
    <PanelCard
      title={sayCount(PARTY_WORDS.watch.doing, PEOPLE.length)}
      isFlush
      className="w-[17rem]"
    >
      <div className="px-5 pb-6 pt-12">
        <SharedTimeline
          label={say('screens.partyPanel.whereEverybodyIs')}
          durationSeconds={RUNS_FOR}
          inSyncSeconds={TOGETHER_WITHIN_SECONDS}
          filledSeconds={ROOM_IS_AT}
          elapsed={formatDuration(ROOM_IS_AT)}
          total={formatDuration(RUNS_FOR)}
          status={
            <Badge size="sm" tone={isInSync ? 'success' : 'warning'}>
              {isInSync
                ? say('common.inSync')
                : say('screens.partyPanel.nameIsSecondsBehind', {
                    name: 'Ruth',
                    seconds: RUTH_IS_BEHIND_BY.toFixed(1),
                  })}
            </Badge>
          }
          people={PEOPLE.map((name) => ({
            id: name,
            atSeconds: atOf(name),
            face: <ShowcaseFace name={name} className="size-10 text-base" />,
            label: say('screens.partyPanel.nameAtPosition', {
              name,
              position: formatDuration(atOf(name)),
            }),
          }))}
        />
      </div>
    </PanelCard>
  );
};

PartyPicture.displayName = 'PartyPicture';

export { PartyPicture };
