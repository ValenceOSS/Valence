import { FolderField } from '@ValenceScreens/components/FolderField/FolderField';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@ValenceUI/Button';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { savePreRollSetup } from '@ValenceClient/admin/savePreRollSetup';
import { failureOfMissing } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { PanelCard } from '@ValenceUI/PanelCard';
import { PRE_ROLL_PLAYS_BEFORE } from '@ValenceContracts/schemas/PreRollSettings';
import type { PreRollChange, PreRollSetup } from '@ValenceContracts/schemas/PreRoll';
import type { PreRollPlaysBefore } from '@ValenceContracts/schemas/PreRollSettings';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

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
 * What the form starts from: the settings as saved.
 *
 * @param setup - The setup as saved.
 * @returns The form's first state.
 */
const draftOf = (setup: PreRollSetup): PreRollChange => ({
  isOn: setup.isOn,
  folder: setup.folder,
  playsBefore: setup.playsBefore,
});

/**
 * Pre-roll: a short clip played before a film or episode that starts from the beginning, such as a
 * household's own intro or a cinema ident, chosen at random from a folder on the server. It says
 * how many clips the folder holds once saved, and why there are none where the folder cannot be
 * read or holds nothing every app can play.
 */
const PreRollCard = () => {
  const cache = useQueryClient();
  const asked = useQuery(adminQueries.preRollSetup());
  const [draft, setDraft] = useState<PreRollChange | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const title = say('screens.adminArea.preRollCard.preRoll');
  const setup = asked.data;

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

  const shown = draft ?? draftOf(setup);
  const isChanged = JSON.stringify(shown) !== JSON.stringify(draftOf(setup));
  const isFolderSaved = setup.folder !== '' && shown.folder === setup.folder;

  const change = (patch: Partial<PreRollChange>) => {
    setDraft({ ...shown, ...patch });
  };

  return (
    <PanelCard title={title}>
      <div className="flex flex-col gap-5">
        <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
          {say('screens.adminArea.preRollCard.aShortClipPlaysFirst')}
        </p>

        <SettingList>
          <SettingRow
            title={say('screens.adminArea.preRollCard.playAClipFirst')}
            description={say('screens.adminArea.preRollCard.everyAppPlaysTheClip')}
          >
            <Switch
              label={say('screens.adminArea.preRollCard.playAClipFirst')}
              isLabelHidden
              isOn={shown.isOn}
              onToggle={() => {
                change({ isOn: !shown.isOn });
              }}
            />
          </SettingRow>

          <SettingRow title={say('screens.adminArea.preRollCard.playsBefore')}>
            <SegmentedRow
              label={say('screens.adminArea.preRollCard.playsBefore')}
              size="sm"
              items={PLAYS_BEFORE_CHOICES}
              value={shown.playsBefore}
              onSelect={(id) => {
                const playsBefore = playsBeforeOf(id);

                if (playsBefore !== null) {
                  change({ playsBefore });
                }
              }}
            />
          </SettingRow>

          <SettingGroup
            title={say('screens.adminArea.preRollCard.clipsFolder')}
            description={say('screens.adminArea.preRollCard.mp4OrMovFiles')}
          >
            <div className="flex flex-col gap-3">
              <FolderField
                label={say('screens.adminArea.preRollCard.clipsFolder')}
                isLabelHidden
                placeholder="/media/pre-roll"
                value={shown.folder}
                onValueChange={(folder) => {
                  change({ folder });
                }}
              />

              {isFolderSaved ? (
                <p className="font-body text-[0.8125rem] text-text-muted">
                  {!setup.isFolderReadable
                    ? say('error.common.valenceIsNotAllowedToRead')
                    : setup.clips.length === 0
                      ? say('screens.adminArea.preRollCard.noClipsInThatFolder')
                      : sayCount('screens.adminArea.preRollCard.countClips', setup.clips.length)}
                </p>
              ) : null}
            </div>
          </SettingGroup>
        </SettingList>

        <div className="flex justify-end">
          <Button
            variant="confirm"
            size="sm"
            disabled={!isChanged}
            isLoading={isSaving}
            onClick={() => {
              setIsSaving(true);

              void savePreRollSetup(shown).then((answer) => {
                setIsSaving(false);

                if (
                  tellOutcome(
                    say('screens.adminArea.preRollCard.savedThePreRollSettings'),
                    failureOfMissing(answer),
                  ) &&
                  answer !== null
                ) {
                  cache.setQueryData(adminQueries.preRollSetup().queryKey, answer);
                  setDraft(null);
                }
              });
            }}
          >
            {say('common.save')}
          </Button>
        </div>
      </div>
    </PanelCard>
  );
};

PreRollCard.displayName = 'PreRollCard';

export { PreRollCard };
