import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SelectField } from '@ValenceUI/SelectField';
import { Switch } from '@ValenceUI/Switch';
import { TextField } from '@ValenceUI/TextField';
import {
  HDR_FORMATS,
  RELEASE_SOURCES,
  RESOLUTIONS,
  VIDEO_CODECS,
} from '@ValenceContracts/schemas/ParsedRelease';
import { FORMAT_CONDITION_KINDS } from '@ValenceContracts/schemas/QualityProfile';
import { QUALITY_NAMES } from '@ValenceScreens/components/AdminArea/QUALITY_NAMES';
import type {
  FormatCondition,
  FormatConditionKind,
} from '@ValenceContracts/schemas/QualityProfile';
import type { HdrFormat, VideoCodec } from '@ValenceContracts/schemas/ParsedRelease';
import type { CustomFormatsProps, FormatDraft } from './CustomFormats.types';
import { say } from '@ValenceI18n/say';

const KIND_NAMES: Readonly<Record<FormatConditionKind, string>> = {
  words: say('common.words'),
  group: say('screens.profileEditor.customFormats.releaseGroup'),
  codec: say('screens.profileEditor.customFormats.videoCodec'),
  hdr: say('screens.profileEditor.customFormats.hdr'),
  source: say('common.source'),
  resolution: say('common.resolution'),
  language: say('common.language'),
  size: say('screens.profileEditor.customFormats.sizeInGb'),
};

const KIND_OPTIONS = FORMAT_CONDITION_KINDS.map((id) => ({ id, label: KIND_NAMES[id] }));

const CODEC_NAMES: Readonly<Record<VideoCodec, string>> = {
  h266: 'H.266',
  av1: 'AV1',
  h265: 'H.265 (HEVC)',
  h264: 'H.264',
  xvid: 'XviD',
  mpeg2: 'MPEG-2',
};

const HDR_NAMES: Readonly<Record<HdrFormat, string>> = {
  dolbyVision: say('client.library.describeRange.dolbyVision'),
  hdr10plus: 'HDR10+',
  hdr10: 'HDR10',
  hlg: 'HLG',
};

const CHOICES: Partial<Record<FormatConditionKind, readonly { id: string; label: string }[]>> = {
  codec: VIDEO_CODECS.map((id) => ({ id, label: CODEC_NAMES[id] })),
  hdr: HDR_FORMATS.map((id) => ({ id, label: HDR_NAMES[id] })),
  source: RELEASE_SOURCES.map((id) => ({ id, label: QUALITY_NAMES[id] })),
  resolution: RESOLUTIONS.map((id) => ({ id, label: QUALITY_NAMES[id] })),
};

const HINTS: Partial<Record<FormatConditionKind, string>> = {
  words: say('screens.profileEditor.customFormats.wordsHint'),
  group: 'FLUX',
  language: 'en',
  size: say('screens.profileEditor.customFormats.sizeHint'),
};

const A_CONDITION: FormatCondition = {
  kind: 'words',
  value: '',
  isNegated: false,
  isRequired: false,
};

/**
 * One condition of a custom format: what it checks, the value it looks for — chosen from a list
 * where there is one, such as a codec, and typed otherwise — and whether it is turned round or
 * required.
 *
 * @param condition - The condition.
 * @param onChange - Told the condition as it changes.
 * @param onRemove - Told to remove it.
 */
const ConditionRow = ({
  condition,
  onChange,
  onRemove,
}: {
  condition: FormatCondition;
  onChange: (condition: FormatCondition) => void;
  onRemove: () => void;
}) => {
  const choices = CHOICES[condition.kind];

  return (
    <li className="flex flex-wrap items-end gap-3">
      <SelectField
        label={say('screens.profileEditor.customFormats.checks')}
        size="sm"
        options={KIND_OPTIONS}
        value={condition.kind}
        onSelect={(next) => {
          const kind = FORMAT_CONDITION_KINDS.find((one) => one === next);

          if (kind !== undefined) {
            onChange({ ...condition, kind, value: CHOICES[kind]?.[0]?.id ?? '' });
          }
        }}
        className="w-40"
      />

      {choices === undefined ? (
        <TextField
          label={say('screens.profileEditor.customFormats.value')}
          size="sm"
          value={condition.value}
          onValueChange={(value) => {
            onChange({ ...condition, value });
          }}
          placeholder={HINTS[condition.kind] ?? ''}
          className="min-w-40 flex-1"
        />
      ) : (
        <SelectField
          label={say('screens.profileEditor.customFormats.value')}
          size="sm"
          options={[...choices]}
          value={condition.value}
          onSelect={(value) => {
            onChange({ ...condition, value });
          }}
          className="min-w-40 flex-1"
        />
      )}

      <Switch
        label={say('screens.profileEditor.customFormats.doesNotMatch')}
        isOn={condition.isNegated}
        onToggle={() => {
          onChange({ ...condition, isNegated: !condition.isNegated });
        }}
      />

      <Switch
        label={say('screens.profileEditor.customFormats.required')}
        isOn={condition.isRequired}
        onToggle={() => {
          onChange({ ...condition, isRequired: !condition.isRequired });
        }}
      />

      <Button
        isIconOnly
        variant="ghost"
        size="xs"
        label={say('screens.profileEditor.customFormats.removeThisCondition')}
        onClick={onRemove}
      >
        <Icon of={XIcon} size={14} />
      </Button>
    </li>
  );
};

ConditionRow.displayName = 'ConditionRow';

/**
 * A quality profile's custom formats, the way Sonarr's are: each a name, a score, and the
 * conditions a release must meet to match it — every required one and at least one of the rest.
 * Formats can be added and removed, and so can their conditions.
 *
 * @param formats - The formats, as the form holds them.
 * @param onChange - Told the formats as they change.
 */
const CustomFormats = ({ formats, onChange }: CustomFormatsProps) => {
  const changeAt = (at: number, format: FormatDraft) => {
    onChange(formats.map((one, index) => (index === at ? format : one)));
  };

  return (
    <div className="flex flex-col gap-4">
      {formats.length === 0 ? (
        <p className="text-sm text-text-muted">
          {say('screens.profileEditor.customFormats.noFormatsYet')}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {formats.map((format, at) => (
            <li
              key={at}
              className="flex flex-col gap-3 rounded-xl border border-[var(--surface-line)] p-4"
            >
              <div className="flex flex-wrap items-end gap-3">
                <TextField
                  label={say('screens.profileEditor.customFormats.formatName')}
                  size="sm"
                  value={format.name}
                  onValueChange={(name) => {
                    changeAt(at, { ...format, name });
                  }}
                  className="min-w-48 flex-1"
                />

                <TextField
                  label={say('screens.profileEditor.customFormats.score')}
                  size="sm"
                  type="number"
                  value={format.score}
                  onValueChange={(score) => {
                    changeAt(at, { ...format, score });
                  }}
                  className="w-32"
                />

                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    onChange(formats.filter((_one, index) => index !== at));
                  }}
                >
                  {say('common.forgetName', {
                    name:
                      format.name.trim() === ''
                        ? say('screens.profileEditor.customFormats.thisFormat')
                        : format.name.trim(),
                  })}
                </Button>
              </div>

              <ul className="flex flex-col gap-3">
                {format.conditions.map((condition, index) => (
                  <ConditionRow
                    key={index}
                    condition={condition}
                    onChange={(next) => {
                      changeAt(at, {
                        ...format,
                        conditions: format.conditions.map((one, place) =>
                          place === index ? next : one,
                        ),
                      });
                    }}
                    onRemove={() => {
                      changeAt(at, {
                        ...format,
                        conditions: format.conditions.filter((_one, place) => place !== index),
                      });
                    }}
                  />
                ))}
              </ul>

              <span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    changeAt(at, { ...format, conditions: [...format.conditions, A_CONDITION] });
                  }}
                >
                  {say('screens.profileEditor.customFormats.addACondition')}
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onChange([...formats, { name: '', score: '0', conditions: [A_CONDITION] }]);
          }}
        >
          {say('screens.profileEditor.customFormats.addAFormat')}
        </Button>
      </span>
    </div>
  );
};

CustomFormats.displayName = 'CustomFormats';

export { CustomFormats };
