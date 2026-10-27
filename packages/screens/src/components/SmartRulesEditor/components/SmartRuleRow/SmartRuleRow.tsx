import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { MultiSelectField } from '@ValenceUI/MultiSelectField';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import { blankRule } from '@ValenceClient/smart/blankRule';
import { Sentence } from '@ValenceScreens/components/Sentence/Sentence';
import { nameSmartRuleKind } from '@ValenceScreens/smart/nameSmartRuleKind';
import type { ReactNode } from 'react';
import type { RuleDraft } from '@ValenceClient/smart/SmartDraft';
import type { SmartRuleRowProps } from './SmartRuleRow.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const STARS = ['1', '2', '3', '4', '5'] as const;

/**
 * One rule of a smart playlist or smart collection, read along a line: what it is about, how it
 * compares, and the genres, libraries or numbers it compares with, then a button that takes it
 * away. Its fields say what they are by their placeholders and are named for whoever is listening.
 *
 * @param rule - The rule as it is being edited.
 * @param kinds - The kinds of rule it may be.
 * @param genres - The genres there are to choose among.
 * @param libraries - The libraries there are to choose among.
 * @param note - Something worth knowing about the rule as it stands, or nothing.
 * @param problem - Why it can't be saved yet, or nothing.
 * @param onChange - Told the rule as it changes.
 * @param onRemove - Takes it away.
 */
const SmartRuleRow = ({
  rule,
  kinds,
  genres,
  libraries,
  note,
  problem,
  onChange,
  onRemove,
}: SmartRuleRowProps) => {
  const choice = (label: string, options: readonly { id: string; label: string }[]) => (
    <SelectField
      label={label}
      isLabelHidden
      size="sm"
      options={[...options]}
      value={rule.choice}
      onSelect={(next) => {
        onChange({ ...rule, choice: next });
      }}
      className="w-40"
    />
  );

  const number = (field: 'first' | 'second', label: string) => (
    <TextField
      label={label}
      isLabelHidden
      size="sm"
      inputMode="decimal"
      placeholder={label}
      value={rule[field]}
      onValueChange={(next) => {
        onChange({ ...rule, [field]: next });
      }}
      className="w-28"
    />
  );

  const phrase = (sentence: ReactNode) => (
    <span className="flex flex-wrap items-center gap-2 text-sm text-text-muted">{sentence}</span>
  );

  const counted = (field: 'first' | 'second') => {
    const said = Number(rule[field].replace(',', '.'));

    return Number.isFinite(said) ? said : 0;
  };

  const picker = (label: string, options: readonly { id: string; label: string }[]) => (
    <MultiSelectField
      label={label}
      isLabelHidden
      size="sm"
      placeholder={label}
      options={options}
      value={rule.picked}
      onChange={(next) => {
        onChange({ ...rule, picked: next });
      }}
      className="min-w-40 flex-1"
    />
  );

  const yesOrNo = [
    { id: 'is', label: say('screens.smartRules.yes') },
    { id: 'isNot', label: say('screens.profilesPanel.describeProfile.no') },
  ];

  const controlsOf = (draft: RuleDraft) => {
    switch (draft.kind) {
      case 'liked':
      case 'followedArtist':
        return choice(say('screens.smartRules.condition'), yesOrNo);
      case 'genre':
        return (
          <>
            {choice(say('screens.smartRules.condition'), [
              { id: 'is', label: say('screens.smartRules.isAnyOf') },
              { id: 'isNot', label: say('screens.smartRules.isNoneOf') },
            ])}
            {picker(
              say('common.genre'),
              [...new Set([...genres, ...draft.picked])].map((genre) => ({
                id: genre,
                label: genre,
              })),
            )}
          </>
        );
      case 'released':
        return phrase(
          <Sentence
            words="screens.smartRules.fromTo"
            fillings={{
              from: number('first', say('server.webhooks.discordEmbedFor.from')),
              to: number('second', say('screens.smartRules.to')),
            }}
          />,
        );
      case 'plays':
        return phrase(
          <Sentence
            words="screens.smartRules.fromToTimes"
            fillings={{
              from: number('first', say('screens.smartRules.atLeast')),
              to: number('second', say('screens.smartRules.atMost')),
            }}
          />,
        );
      case 'lastPlayed':
        return (
          <>
            {choice(say('screens.smartRules.condition'), [
              { id: 'within', label: say('screens.smartRules.inTheLast') },
              { id: 'notWithin', label: say('screens.smartRules.notInTheLast') },
            ])}
            {phrase(
              <Sentence
                counted="common.count.days"
                count={counted('first')}
                fillings={{ count: number('first', say('screens.smartRules.days')) }}
              />,
            )}
          </>
        );
      case 'added':
        return phrase(
          <Sentence
            counted="screens.smartRules.inTheLastDays"
            count={counted('first')}
            fillings={{ count: number('first', say('screens.smartRules.days')) }}
          />,
        );
      case 'runtime':
        return phrase(
          <Sentence
            words="screens.smartRules.fromToMinutes"
            fillings={{
              from: number('first', say('screens.smartRules.atLeast')),
              to: number('second', say('screens.smartRules.atMost')),
            }}
          />,
        );
      case 'watched':
        return choice(say('screens.smartRules.condition'), [
          { id: 'unwatched', label: say('screens.smartRules.notStarted') },
          { id: 'inProgress', label: say('common.inProgress') },
          { id: 'finished', label: say('common.finished') },
          { id: 'notFinished', label: say('screens.smartRules.notFinished') },
        ]);
      case 'rating':
        return phrase(
          <Sentence
            words="screens.smartRules.atLeastOutOfTen"
            fillings={{ rating: number('first', say('screens.smartRules.atLeast')) }}
          />,
        );
      case 'yourStars':
        return choice(
          say('screens.smartRules.condition'),
          STARS.map((stars) => ({
            id: stars,
            label: sayCount('screens.smartRules.starsOrMore', Number(stars)),
          })),
        );
      case 'library':
        return picker(
          say('common.libraries'),
          libraries.map((one) => ({ id: one.id, label: one.name })),
        );
      case 'ageRating':
        return number('first', say('screens.smartRules.upToAge'));
    }
  };

  return (
    <li className="flex flex-col gap-1.5 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <SelectField
          label={say('screens.smartRules.rule')}
          isLabelHidden
          size="sm"
          options={kinds.map((kind) => ({ id: kind, label: nameSmartRuleKind(kind) }))}
          value={rule.kind}
          onSelect={(next) => {
            const kind = kinds.find((one) => one === next);

            if (kind !== undefined && kind !== rule.kind) {
              onChange(blankRule(kind, rule.key));
            }
          }}
          className="w-44"
        />

        {controlsOf(rule)}

        <Button
          isIconOnly
          variant="ghost"
          size="xs"
          label={say('screens.smartRules.removeThisRule')}
          onClick={onRemove}
          className="ml-auto"
        >
          <Icon of={XIcon} size={14} />
        </Button>
      </div>

      {note === null ? null : <p className="text-[0.8125rem] text-text-muted">{note}</p>}

      {problem === null ? null : (
        <p role="alert" className="text-[0.8125rem] text-danger">
          {problem}
        </p>
      )}
    </li>
  );
};

SmartRuleRow.displayName = 'SmartRuleRow';

export { SmartRuleRow };
