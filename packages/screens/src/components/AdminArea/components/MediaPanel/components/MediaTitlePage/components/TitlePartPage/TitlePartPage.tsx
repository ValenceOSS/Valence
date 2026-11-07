import { ArtworkChooser } from '@ValenceScreens/components/AdminArea/components/ArtworkChooser/ArtworkChooser';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TitlePeople } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitlePeople/TitlePeople';
import { motion, useReducedMotionConfig } from 'motion/react';
import { MoveLeft as MoveLeftIcon, MoveRight as MoveRightIcon } from '@keyline-icons/react';
import { Breadcrumbs } from '@ValenceUI/Breadcrumbs';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TabPanel } from '@ValenceUI/TabPanel';
import { TabRow } from '@ValenceUI/TabRow';
import { Tabs } from '@ValenceUI/Tabs';
import { useShortcut } from '@ValenceUI/useShortcut';
import { useTravelDirection } from '@ValenceUI/useTravelDirection';
import { revealTransition, revealVariants } from '@ValenceUI/animations/reveal';
import { MediaTitleHero } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/MediaTitleHero/MediaTitleHero';
import { TitleDetails } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/TitleDetails';
import { TitleHistory } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleHistory/TitleHistory';
import type { TitleTab } from '@ValenceScreens/components/AdminArea/components/MediaPanel/TitlePlace.types';
import type { TitlePartPageProps } from './TitlePartPage.types';
import { say } from '@ValenceI18n/say';

const PART_TABS: readonly TitleTab[] = ['details', 'people', 'artwork', 'files', 'history'];

/**
 * One season or one episode of a programme as a page of its own, laid out as the programme's is:
 * the trail back up to the programme above it, with the way to the one before and after, its
 * picture, name and facts, and its details, an episode's guest stars, its files and its history on
 * tabs.
 *
 * @param scope - Whether it is a season or an episode.
 * @param mediaId - A file of it.
 * @param name - What it is called.
 * @param aside - What is set beside the name, such as an episode's number.
 * @param imageUrl - Its picture: an episode's still, or the programme's poster for a season.
 * @param trail - The steps back up to every title, the programme and, for an episode, its season.
 * @param onTrail - Told which step was pressed.
 * @param badges - What stands out about it, such as its quality.
 * @param facts - What else it is, each named.
 * @param actions - What can be done to it.
 * @param tab - The tab shown.
 * @param onTab - Told the tab chosen.
 * @param filesLabel - What the files tab is called: the file of an episode, a season's episodes.
 * @param files - What the files tab shows.
 * @param onPrevious - Opens the one before, where there is one.
 * @param onNext - Opens the one after, where there is one.
 * @param artworkPart - Its season and episode, where its own picture can be chosen.
 */
const TitlePartPage = ({
  scope,
  mediaId,
  name,
  aside,
  imageUrl,
  trail,
  onTrail,
  badges,
  facts,
  actions,
  tab,
  onTab,
  filesLabel,
  files,
  onPrevious,
  onNext,
  artworkPart,
}: TitlePartPageProps) => {
  const shown =
    PART_TABS.includes(tab) &&
    (tab !== 'people' || scope === 'episode') &&
    (tab !== 'artwork' || artworkPart !== undefined)
      ? tab
      : 'details';
  const travel = useTravelDirection([...PART_TABS], shown);
  const prefersReducedMotion = useReducedMotionConfig();

  useShortcut('K', onPrevious);
  useShortcut('J', onNext);

  return (
    <Tabs
      value={shown}
      onValueChange={(next) => {
        const chosen = PART_TABS.find((one) => one === next);

        if (chosen !== undefined) {
          onTab(chosen);
        }
      }}
    >
      <motion.div
        className="flex flex-col gap-4"
        initial="hidden"
        animate="shown"
        variants={revealVariants(prefersReducedMotion)}
        transition={revealTransition(prefersReducedMotion, 'heavy')}
      >
        <div className="flex items-center justify-between gap-3">
          <Breadcrumbs
            label={say('common.whereYouAre')}
            crumbs={trail}
            onChoose={onTrail}
            className="min-w-0"
          />

          {onPrevious === undefined && onNext === undefined ? null : (
            <span className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                isIconOnly
                label={say('common.previous')}
                shortcut={['K']}
                disabled={onPrevious === undefined}
                {...(onPrevious === undefined ? {} : { onClick: onPrevious })}
              >
                <Icon of={MoveLeftIcon} size={15} />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                isIconOnly
                label={say('common.next')}
                shortcut={['J']}
                disabled={onNext === undefined}
                {...(onNext === undefined ? {} : { onClick: onNext })}
              >
                <Icon of={MoveRightIcon} size={15} />
              </Button>
            </span>
          )}
        </div>

        <MediaTitleHero
          name={name}
          aside={aside}
          posterUrl={imageUrl}
          isWide={scope === 'episode'}
          badges={badges}
          facts={facts}
          actions={actions}
          tabs={
            <TabRow
              label={say('screens.adminArea.mediaTitlePage.whatToShowOfTheTitle')}
              tone="underlined"
              size="sm"
              value={shown}
              groups={[
                {
                  items: [
                    { id: 'details', label: say('common.details') },
                    ...(scope === 'episode' ? [{ id: 'people', label: say('common.people') }] : []),
                    ...(artworkPart === undefined
                      ? []
                      : [{ id: 'artwork', label: say('common.artwork') }]),
                    { id: 'files', label: filesLabel },
                    { id: 'history', label: say('common.history') },
                  ],
                },
              ]}
            />
          }
        >
          <TabPanel value="details" travel={travel}>
            <TitleDetails
              key={mediaId}
              mediaId={mediaId}
              scope={scope}
              onShowHistory={() => {
                onTab('history');
              }}
            />
          </TabPanel>

          {scope === 'episode' ? (
            <TabPanel value="people" travel={travel}>
              <TitlePeople
                key={mediaId}
                mediaId={mediaId}
                scope="episode"
                field="guestStars"
                onShowHistory={() => {
                  onTab('history');
                }}
              />
            </TabPanel>
          ) : null}

          {artworkPart === undefined ? null : (
            <TabPanel value="artwork" travel={travel}>
              <PanelCard title={say('screens.adminArea.artworkChooser.picturesOfTheTitle')}>
                <ArtworkChooser
                  key={mediaId}
                  subject={{ mediaId, name, isSeries: true, mediaIds: [mediaId] }}
                  part={artworkPart}
                  onChanged={() => {}}
                />
              </PanelCard>
            </TabPanel>
          )}

          <TabPanel value="files" travel={travel}>
            {files}
          </TabPanel>

          <TabPanel value="history" travel={travel}>
            <TitleHistory key={mediaId} mediaId={mediaId} scope={scope} kind={scope} />
          </TabPanel>
        </MediaTitleHero>
      </motion.div>
    </Tabs>
  );
};

TitlePartPage.displayName = 'TitlePartPage';

export { TitlePartPage };
