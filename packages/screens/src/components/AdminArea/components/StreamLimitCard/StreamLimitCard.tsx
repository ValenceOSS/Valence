import { QUALITY_STEPS, QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import { SelectField } from '@ValenceUI/SelectField';
import { Switch } from '@ValenceUI/Switch';
import { LimitRow } from './components/LimitRow/LimitRow';
import type { StreamLimitCardProps } from './StreamLimitCard.types';
import { say } from '@ValenceI18n/say';

const NO_LIMIT = 'none';

const OFFERED_QUALITIES = QUALITY_STEPS.filter((step) => step.id !== '240p' && step.id !== '144p');

const BITRATE_CHOICES = ['40', '20', '10', '8', '4', '2'] as const;

const STREAM_CHOICES = ['1', '2', '3', '4', '5', '10'] as const;

/**
 * The choices a menu offers, with a value saved earlier that is not among them kept in its place,
 * highest first, so opening the menu never changes what is saved.
 *
 * @param choices - The usual choices, highest first for bitrates and lowest first for counts.
 * @param saved - What is saved, or empty for no limit.
 * @returns The choices to offer.
 */
const withSaved = (choices: readonly string[], saved: string): string[] => {
  const isHighestFirst = Number(choices[0]) > Number(choices.at(-1));

  return saved === '' || choices.includes(saved)
    ? [...choices]
    : [...choices, saved].sort((a, b) =>
        isHighestFirst ? Number(b) - Number(a) : Number(a) - Number(b),
      );
};

/**
 * How much something may stream, as one card: the highest quality, and whether downloads are held
 * to it too, the highest bitrate and how many streams at once, each beside what it does. A note
 * beneath says what lower limits cost the server, since every one of them is met by transcoding.
 *
 * @param typed - What each control holds.
 * @param onChange - Told what each control holds after a change.
 * @param children - What to say above the card, such as whose limits these are.
 */
const StreamLimitCard = ({ typed, onChange, children }: StreamLimitCardProps) => {
  return (
    <div className="flex flex-col gap-3">
      {children}

      <ul className="flex flex-col divide-y divide-[var(--surface-line)] rounded-xl bg-[var(--surface-hover)] ring-1 ring-inset ring-[var(--surface-line)]">
        <LimitRow
          label={say('screens.adminArea.linkedServersPanel.highestQuality')}
          detail={say('screens.adminArea.streamLimitCard.anythingAboveThisIsSentAt')}
          control={
            <SelectField
              label={say('screens.adminArea.linkedServersPanel.highestQuality')}
              isLabelHidden
              size="sm"
              className="w-36 shrink-0"
              options={[
                { id: NO_LIMIT, label: say('common.noLimit') },
                ...OFFERED_QUALITIES.map((step) => ({ id: step.id, label: step.label })),
              ]}
              value={typed.quality ?? NO_LIMIT}
              onSelect={(id) => {
                onChange({ ...typed, quality: QualityStepIdSchema.safeParse(id).data ?? null });
              }}
            />
          }
        />

        {typed.quality === null ? null : (
          <LimitRow
            label={say('screens.adminArea.streamLimitCard.limitDownloadsToo')}
            detail={say('screens.adminArea.streamLimitCard.downloadsAreSavedAtThisQuality')}
            control={
              <Switch
                label={say('screens.adminArea.streamLimitCard.limitDownloadsToo')}
                isLabelHidden
                isOn={typed.limitsDownloads}
                onToggle={() => {
                  onChange({ ...typed, limitsDownloads: !typed.limitsDownloads });
                }}
                className="shrink-0"
              />
            }
          />
        )}

        <LimitRow
          label={say('screens.adminArea.streamLimitCard.highestBitrate')}
          detail={say('screens.adminArea.streamLimitCard.everythingPlayedIsSentAtOr')}
          control={
            <SelectField
              label={say('screens.adminArea.streamLimitCard.highestBitrate')}
              isLabelHidden
              size="sm"
              className="w-36 shrink-0"
              options={[
                { id: NO_LIMIT, label: say('common.noLimit') },
                ...withSaved(BITRATE_CHOICES, typed.bitrate).map((mbps) => ({
                  id: mbps,
                  label: say('client.playback.describeRungCost.valueMbps', { value: mbps }),
                })),
              ]}
              value={typed.bitrate === '' ? NO_LIMIT : typed.bitrate}
              onSelect={(id) => {
                onChange({ ...typed, bitrate: id === NO_LIMIT ? '' : id });
              }}
            />
          }
        />

        <LimitRow
          label={say('screens.adminArea.accountStreamLimits.streamsAtOnce')}
          detail={say('screens.adminArea.streamLimitCard.howManyThingsCanPlayAt')}
          control={
            <SelectField
              label={say('screens.adminArea.accountStreamLimits.streamsAtOnce')}
              isLabelHidden
              size="sm"
              className="w-36 shrink-0"
              options={[
                { id: NO_LIMIT, label: say('common.noLimit') },
                ...withSaved(STREAM_CHOICES, typed.streams).map((count) => ({
                  id: count,
                  label: count,
                })),
              ]}
              value={typed.streams === '' ? NO_LIMIT : typed.streams}
              onSelect={(id) => {
                onChange({ ...typed, streams: id === NO_LIMIT ? '' : id });
              }}
            />
          }
        />
      </ul>

      <p className="px-1 text-xs text-text-muted">
        {say('screens.adminArea.streamLimitCard.lowerLimitsMeanMoreOfWhat')}
      </p>
    </div>
  );
};

StreamLimitCard.displayName = 'StreamLimitCard';

export { StreamLimitCard };
