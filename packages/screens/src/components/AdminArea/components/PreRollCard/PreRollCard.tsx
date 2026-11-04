import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { savePreRollSetup } from '@ValenceClient/admin/savePreRollSetup';
import { useSavedSetting } from '@ValenceScreens/admin/useSavedSetting';
import { FolderField } from '@ValenceScreens/components/FolderField/FolderField';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { PRE_ROLL_PLAYS_BEFORE } from '@ValenceContracts/schemas/PreRollSettings';
import { say } from '@ValenceI18n/say';
import type { PreRollChange, PreRollSetup } from '@ValenceContracts/schemas/PreRoll';
import type { PreRollPlaysBefore } from '@ValenceContracts/schemas/PreRollSettings';

const TYPING_SETTLES_MS = 700;

const PLAYS_BEFORE_LABELS: Record<PreRollPlaysBefore, string> = {
  films: say('common.films'),
  episodes: say('common.episodes'),
  both: say('screens.adminArea.preRollCard.filmsAndEpisodes'),
};

const PLAYS_BEFORE_CHOICES = PRE_ROLL_PLAYS_BEFORE.map((id) => ({
  id,
  label: PLAYS_BEFORE_LABELS[id],
}));

/**
 * Reads which of the choices of what pre-roll plays before was picked.
 *
 * @param id - What was picked.
 * @returns The choice, or nothing where it is not one.
 */
const playsBeforeOf = (id: string): PreRollPlaysBefore | null =>
  PRE_ROLL_PLAYS_BEFORE.find((one) => one === id) ?? null;

/**
 * Saves the pre-roll setup and keeps the answer, so how many clips the folder holds is current.
 *
 * @param change - The whole setup to save.
 * @param remember - Keeps what the server answered.
 * @returns Whether it saved.
 */
const saveSetup = (
  change: PreRollChange,
  remember: (setup: PreRollSetup) => void,
): Promise<boolean> =>
  savePreRollSetup(change).then((answer) => {
    if (answer !== null) {
      remember(answer);
    }

    return answer !== null;
  });

/**
 * Pre-roll: a short clip played before a film or episode that starts from the beginning, chosen at
 * random from a folder on the server. Each setting saves as it is changed, and the folder once the
 * typing stops; where the folder can't be read or holds no clips every app can play, it says so.
 */
const PreRollCard = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.preRollSetup());
  const title = say('screens.adminArea.preRollCard.preRoll');
  const setup = asked.data;

  const remember = (answer: PreRollSetup) => {
    cache.setQueryData(adminQueries.preRollSetup().queryKey, answer);
  };

  const words = {
    done: say('screens.adminArea.preRollCard.savedThePreRollSettings'),
    failed: say('screens.adminArea.preRollCard.thePreRollSettingsCouldNotBeSaved'),
  };

  const [choices, changeChoices] = useSavedSetting(
    { isOn: setup?.isOn ?? false, playsBefore: setup?.playsBefore ?? 'films' },
    (next) => saveSetup({ ...next, folder: setup?.folder ?? '' }, remember),
    words,
  );

  const [folder, changeFolder] = useSavedSetting(
    setup?.folder ?? '',
    (next) => saveSetup({ ...choices, folder: next }, remember),
    { ...words, delayMs: TYPING_SETTLES_MS },
  );

  if (asked.isError) {
    return (
      <PanelCard title={title}>
        <CouldNotRead
          said={say('screens.adminArea.preRollCard.thePreRollSettingsCouldNotBe')}
          isTryingAgain={asked.isFetching}
          onTryAgain={() => {
            void asked.refetch();
          }}
        />
      </PanelCard>
    );
  }

  if (setup === undefined) {
    return (
      <PanelCard title={title}>
        <Spinner
          isCentered
          size="sm"
          label={say('screens.adminArea.preRollCard.readingThePreRollSettings')}
        />
      </PanelCard>
    );
  }

  const isFolderSaved = setup.folder !== '' && folder === setup.folder;
  const folderProblem = !isFolderSaved
    ? null
    : !setup.isFolderReadable
      ? say('error.common.valenceIsNotAllowedToRead')
      : setup.clips.length === 0
        ? say('screens.adminArea.preRollCard.noClipsInThatFolder')
        : null;

  return (
    <PanelCard title={title} isFlush>
      <SettingList isInset>
        <SettingRow
          title={say('screens.adminArea.preRollCard.playAClipFirst')}
          info={
            <PanelCardInfo
              label={say('screens.adminArea.statStrip.aboutLabel', {
                label: say('screens.adminArea.preRollCard.playAClipFirst'),
              })}
              detail={say('screens.adminArea.preRollCard.playAClipFirstAbout')}
              align="start"
            />
          }
          description={say('screens.adminArea.preRollCard.playAClipFirstDetail')}
        >
          <Switch
            label={say('screens.adminArea.preRollCard.playAClipFirst')}
            isLabelHidden
            isOn={choices.isOn}
            onToggle={() => {
              changeChoices({ ...choices, isOn: !choices.isOn });
            }}
          />
        </SettingRow>

        {choices.isOn ? (
          <>
            <SettingRow title={say('screens.adminArea.preRollCard.playsBefore')}>
              <SegmentedRow
                label={say('screens.adminArea.preRollCard.playsBefore')}
                size="sm"
                tone="accent"
                items={PLAYS_BEFORE_CHOICES}
                value={choices.playsBefore}
                onSelect={(id) => {
                  const playsBefore = playsBeforeOf(id);

                  if (playsBefore !== null) {
                    changeChoices({ ...choices, playsBefore });
                  }
                }}
              />
            </SettingRow>

            <SettingRow
              title={say('screens.observabilityPage.jobHistory.folder')}
              description={
                folderProblem === null ? (
                  say('screens.adminArea.preRollCard.folderDetail')
                ) : (
                  <span className="text-danger">{folderProblem}</span>
                )
              }
            >
              <div className="w-80 max-w-full">
                <FolderField
                  label={say('screens.observabilityPage.jobHistory.folder')}
                  isLabelHidden
                  value={folder}
                  onValueChange={changeFolder}
                />
              </div>
            </SettingRow>
          </>
        ) : null}
      </SettingList>
    </PanelCard>
  );
};

PreRollCard.displayName = 'PreRollCard';

export { PreRollCard };
