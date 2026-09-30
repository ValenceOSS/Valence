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
        what="When downloads are given up on"
        isTryingAgain={rules.isFetching}
        onTryAgain={() => {
          void rules.refetch();
        }}
      />
    );
  }

  if (rules.isPending) {
    return <Spinner isCentered label="Reading when downloads are given up on" size="sm" />;
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
          tellOutcome(`${what} saved.`, failureOfRefusal(refusal));
          isOutOfStep.current ||= refusal !== null;
        },
        () => {
          tellOutcome('', `${what} could not be saved.`);
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
    <div className="flex flex-col gap-2 pt-4">
      <p className="px-5 font-body text-[0.8125rem] leading-snug text-text-muted">
        When a download runs into one of these, Valence removes it, blocklists the release for that
        request, and looks for the next best.
      </p>

      <SettingList>
        <WaitRow
          title="Missing metadata"
          description="A magnet that never learns what files it holds, usually because nobody is sharing it."
          choices={metadataWaitChoices}
          value={kept.metadataMinutes}
          unit="minutes"
          onChange={(metadataMinutes) => {
            change({ metadataMinutes }, 'Missing metadata');
          }}
        />

        <WaitRow
          title="Stalled"
          description="It started, but nobody is sending it any more."
          choices={stalledWaitChoices}
          value={kept.stalledHours}
          unit="hours"
          onChange={(stalledHours) => {
            change({ stalledHours }, 'Stalled');
          }}
        />

        <WaitRow
          title="Too slow"
          description="At the rate it has averaged, it would still be going after this long."
          choices={slowWaitChoices}
          value={kept.slowDays}
          unit="days"
          onChange={(slowDays) => {
            change({ slowDays }, 'Too slow');
          }}
        />

        <SettingRow
          title="Unrecognised files"
          description="A torrent holding nothing Valence could file into a library."
        >
          <Switch
            label="Give up on unrecognised files"
            isLabelHidden
            isOn={kept.refusesUnknownFiles}
            onToggle={() => {
              change({ refusesUnknownFiles: !kept.refusesUnknownFiles }, 'Unrecognised files');
            }}
          />
        </SettingRow>
      </SettingList>
    </div>
  );
};

GiveUpRulesList.displayName = 'GiveUpRulesList';

export { GiveUpRulesList };
