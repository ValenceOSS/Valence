import { useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { SettingList } from '@ValenceUI/SettingList';
import { SettingRow } from '@ValenceUI/SettingRow';
import { Spinner } from '@ValenceUI/Spinner';
import { Switch } from '@ValenceUI/Switch';
import { requestsQueries } from '@ValenceClient/query/requestsQueries';
import { changeGiveUpRules } from '@ValenceClient/requests/fetchGiveUpRules';
import { failureOfRefusal } from '@ValenceScreens/admin/failureOf';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import { metadataWaitChoices } from './metadataWaitChoices';
import { slowWaitChoices } from './slowWaitChoices';
import { stalledWaitChoices } from './stalledWaitChoices';
import { WaitRow } from './components/WaitRow/WaitRow';
import type { GiveUpRules } from '@ValenceContracts/schemas/GiveUpRules';
import { say } from '@ValenceI18n/say';

/**
 * When Valence gives up on a download: how long each kind of trouble is waited out before the
 * download is removed, its release blocklisted and the next best looked for, or never.
 *
 * A change shows at once and is saved as it is made. Saves go one after another in the order they
 * were made, since each sends every rule and a slower earlier one landing last would undo a later
 * change. If the service refuses one, what it holds is read again once every save still waiting has
 * gone, so the page settles on the rules in force without a read landing between two saves and
 * putting back what a later one changed.
 */
const GiveUpRulesList = () => {
  const cache = useQueryClient();
  const rules = useQuery(requestsQueries.giveUpRules());
  const saving = useRef<Promise<void>>(Promise.resolve());
  const waiting = useRef(0);
  const isOutOfStep = useRef(false);

  if (rules.isError) {
    return (
      <CouldNotRead
        said={say('screens.downloadsPanel.giveUpRulesList.whenDownloadsAreGivenUpOnCouldNotBeRead')}
        isTryingAgain={rules.isFetching}
        onTryAgain={() => {
          void rules.refetch();
        }}
      />
    );
  }

  if (rules.isPending) {
    return (
      <Spinner
        isCentered
        label={say('screens.downloadsPanel.giveUpRulesList.readingWhenDownloadsAreGivenUp')}
        size="sm"
      />
    );
  }

  const kept = rules.data;

  const change = (next: Partial<GiveUpRules>, what: string) => {
    const changed = { ...kept, ...next };
    const { queryKey } = requestsQueries.giveUpRules();

    void cache.cancelQueries({ queryKey });
    cache.setQueryData(queryKey, changed);
    waiting.current += 1;

    saving.current = saving.current
      .then(() => changeGiveUpRules(changed))
      .then(
        ({ refusal }) => {
          tellOutcome(
            say('screens.adminArea.giveUpRulesList.whatSaved', { what }),
            failureOfRefusal(refusal),
          );
          isOutOfStep.current ||= refusal !== null;
        },
        () => {
          tellOutcome(
            '',
            say('screens.downloadsPanel.giveUpRulesList.whatCouldNotBeSaved', { what }),
          );
          isOutOfStep.current = true;
        },
      )
      .then(() => {
        waiting.current -= 1;

        if (waiting.current === 0 && isOutOfStep.current) {
          isOutOfStep.current = false;
          void cache.invalidateQueries({ queryKey });
        }
      });
  };

  return (
    <div className="flex flex-col gap-2 px-5 pb-2 pt-4">
      <p className="font-body text-[0.8125rem] leading-snug text-text-muted">
        {say('screens.downloadsPanel.giveUpRulesList.whenADownloadRunsIntoOne')}
      </p>

      <SettingList>
        <WaitRow
          title={say('screens.downloadsPanel.giveUpRulesList.missingMetadata')}
          description={say('screens.downloadsPanel.giveUpRulesList.aMagnetThatNeverLearnsWhat')}
          choices={metadataWaitChoices}
          value={kept.metadataMinutes}
          unit="minutes"
          onChange={(metadataMinutes) => {
            change(
              { metadataMinutes },
              say('screens.downloadsPanel.giveUpRulesList.missingMetadata'),
            );
          }}
        />

        <WaitRow
          title={say('common.stalled')}
          description={say('screens.downloadsPanel.giveUpRulesList.itStartedButNobodyIsSending')}
          choices={stalledWaitChoices}
          value={kept.stalledHours}
          unit="hours"
          onChange={(stalledHours) => {
            change({ stalledHours }, say('common.stalled'));
          }}
        />

        <WaitRow
          title={say('screens.downloadsPanel.giveUpRulesList.tooSlow')}
          description={say('screens.downloadsPanel.giveUpRulesList.atTheRateItHasAveraged')}
          choices={slowWaitChoices}
          value={kept.slowDays}
          unit="days"
          onChange={(slowDays) => {
            change({ slowDays }, say('screens.downloadsPanel.giveUpRulesList.tooSlow'));
          }}
        />

        <SettingRow
          title={say('screens.downloadsPanel.giveUpRulesList.unrecognisedFiles')}
          description={say(
            'screens.downloadsPanel.giveUpRulesList.aTorrentHoldingNothingValenceCould',
          )}
        >
          <Switch
            label={say('screens.downloadsPanel.giveUpRulesList.giveUpOnUnrecognisedFiles')}
            isLabelHidden
            isOn={kept.refusesUnknownFiles}
            onToggle={() => {
              change(
                { refusesUnknownFiles: !kept.refusesUnknownFiles },
                say('screens.downloadsPanel.giveUpRulesList.unrecognisedFiles'),
              );
            }}
          />
        </SettingRow>
      </SettingList>
    </div>
  );
};

GiveUpRulesList.displayName = 'GiveUpRulesList';

export { GiveUpRulesList };
