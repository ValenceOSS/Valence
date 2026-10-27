import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus as PlusIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { SelectField } from '@ValenceUI/SelectField';
import { TextField } from '@ValenceUI/TextField';
import {
  MOST_SMART_ENTRIES,
  SONG_ORDERS,
  TITLE_ORDERS,
} from '@ValenceContracts/schemas/SmartRules';
import { isEpisodicKind } from '@ValenceContracts/functions/isEpisodicKind';
import { blankRule } from '@ValenceClient/smart/blankRule';
import { songRuleOf } from '@ValenceClient/smart/songRuleOf';
import { titleRuleOf } from '@ValenceClient/smart/titleRuleOf';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { SmartRuleRow } from './components/SmartRuleRow/SmartRuleRow';
import type { SongOrder, TitleOrder } from '@ValenceContracts/schemas/SmartRules';
import type { SmartRuleKind } from '@ValenceClient/smart/SmartDraft';
import type { SmartRulesEditorProps } from './SmartRulesEditor.types';
import { say } from '@ValenceI18n/say';

const SONG_RULE_KINDS = [
  'liked',
  'followedArtist',
  'genre',
  'released',
  'plays',
  'lastPlayed',
  'added',
] as const satisfies readonly SmartRuleKind[];

const TITLE_RULE_KINDS = [
  'watched',
  'genre',
  'released',
  'runtime',
  'rating',
  'yourStars',
  'added',
  'library',
  'ageRating',
] as const satisfies readonly SmartRuleKind[];

/**
 * What an order of songs is called.
 *
 * @param order - The order.
 * @returns Its name.
 */
const nameSongOrder = (order: SongOrder): string => {
  switch (order) {
    case 'random':
      return say('screens.smartRules.shuffledNewEachDay');
    case 'mostPlayed':
      return say('screens.smartRules.mostPlayedFirst');
    case 'lastPlayed':
      return say('screens.smartRules.playedMostRecentlyFirst');
    case 'added':
      return say('screens.smartRules.addedMostRecentlyFirst');
    case 'released':
      return say('screens.smartRules.releasedMostRecentlyFirst');
    case 'title':
      return say('screens.smartRules.byTitle');
  }
};

/**
 * What an order of films and shows is called.
 *
 * @param order - The order.
 * @returns Its name.
 */
const nameTitleOrder = (order: TitleOrder): string => {
  switch (order) {
    case 'random':
      return say('screens.smartRules.shuffledNewEachDay');
    case 'added':
      return say('screens.smartRules.addedMostRecentlyFirst');
    case 'released':
      return say('screens.smartRules.releasedMostRecentlyFirst');
    case 'title':
      return say('screens.smartRules.byTitle');
    case 'rating':
      return say('screens.smartRules.bestRatedFirst');
    case 'yourStars':
      return say('screens.smartRules.mostStarsFirst');
  }
};

/**
 * The rules of a smart playlist or smart collection: what it holds, each rule everything in it
 * keeps, the order it is in and the most it holds. Rules are added, changed and taken away here; a
 * rule that can't be saved as it stands says so once somebody has tried.
 *
 * @param of - Whether the rules are about songs, or films and shows.
 * @param draft - The rules as they are being edited.
 * @param onChange - Told the rules as they change.
 * @param isChecked - Whether somebody has tried to save, so unfinished rules say so.
 */
const SmartRulesEditor = ({ of, draft, onChange, isChecked }: SmartRulesEditorProps) => {
  const made = useRef(0);
  const isSongs = of === 'songs';
  const songGenres = useQuery({ ...musicQueries.genres(), enabled: isSongs });
  const facets = useQuery({ ...libraryQueries.facets(), enabled: !isSongs });
  const libraries = useQuery({ ...libraryQueries.all(), enabled: !isSongs });
  const kinds = isSongs
    ? SONG_RULE_KINDS
    : draft.holds === 'films'
      ? TITLE_RULE_KINDS
      : TITLE_RULE_KINDS.filter((kind) => kind !== 'runtime');
  const genres = (isSongs ? songGenres.data : facets.data?.genres) ?? [];
  const videoLibraries = (libraries.data ?? []).flatMap((one) =>
    (draft.holds === 'films' ? one.kind === 'movies' : isEpisodicKind(one.kind))
      ? [{ id: one.id, name: one.name }]
      : [],
  );

  const limit = draft.limit.trim();
  const isLimitWrong =
    isChecked &&
    limit !== '' &&
    !(Number.isInteger(Number(limit)) && Number(limit) >= 1 && Number(limit) <= MOST_SMART_ENTRIES);

  const add = () => {
    made.current += 1;

    const unused = kinds.find((kind) => !draft.rules.some((rule) => rule.kind === kind));

    onChange({
      ...draft,
      rules: [
        ...draft.rules,
        blankRule(unused ?? (isSongs ? 'liked' : 'watched'), `new-${String(made.current)}`),
      ],
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {isSongs ? null : (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-text">{say('common.holds')}</span>
          <SegmentedRow
            label={say('common.holds')}
            size="sm"
            items={[
              { id: 'films', label: say('common.films') },
              { id: 'series', label: say('common.shows') },
            ]}
            value={draft.holds}
            onSelect={(next) => {
              if (next === 'films' || next === 'series') {
                onChange({ ...draft, holds: next });
              }
            }}
          />
        </div>
      )}

      <section
        aria-label={say('screens.adminArea.downloadsPanel.rules')}
        className="flex flex-col gap-2"
      >
        <h3 className="text-sm font-medium text-text">
          {say('screens.adminArea.downloadsPanel.rules')}
        </h3>

        <div className="overflow-hidden rounded-xl border border-line">
          {draft.rules.length === 0 ? (
            <p className="px-4 py-3 text-[0.8125rem] text-text-muted">
              {isSongs
                ? say('screens.smartRules.withNoRulesSongs')
                : say('screens.smartRules.withNoRulesTitles')}
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {draft.rules.map((rule) => {
                const isComplete = (isSongs ? songRuleOf(rule) : titleRuleOf(rule)) !== null;

                return (
                  <SmartRuleRow
                    key={rule.key}
                    rule={rule}
                    kinds={kinds.some((kind) => kind === rule.kind) ? kinds : [...kinds, rule.kind]}
                    genres={genres}
                    libraries={videoLibraries}
                    note={
                      !isSongs && rule.kind === 'runtime' && draft.holds === 'series'
                        ? say('screens.smartRules.onlyFilmsHaveARuntime')
                        : null
                    }
                    problem={
                      isChecked && !isComplete ? say('screens.smartRules.finishThisRule') : null
                    }
                    onChange={(next) => {
                      onChange({
                        ...draft,
                        rules: draft.rules.map((one) => (one.key === rule.key ? next : one)),
                      });
                    }}
                    onRemove={() => {
                      onChange({
                        ...draft,
                        rules: draft.rules.filter((one) => one.key !== rule.key),
                      });
                    }}
                  />
                );
              })}
            </ul>
          )}

          <div className="border-t border-line px-1.5 py-1.5">
            <Button variant="ghost" size="sm" onClick={add}>
              <Icon of={PlusIcon} size={16} />
              {say('screens.smartRules.addARule')}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)_9rem] items-start gap-3">
        <SelectField
          label={say('common.order')}
          size="sm"
          options={
            isSongs
              ? SONG_ORDERS.map((order) => ({ id: order, label: nameSongOrder(order) }))
              : TITLE_ORDERS.map((order) => ({ id: order, label: nameTitleOrder(order) }))
          }
          value={draft.order}
          onSelect={(next) => {
            onChange({ ...draft, order: next });
          }}
        />

        <TextField
          label={say('screens.smartRules.limit')}
          size="sm"
          inputMode="numeric"
          placeholder={say('common.noLimit')}
          value={draft.limit}
          {...(isLimitWrong
            ? {
                error: say('screens.smartRules.aWholeNumberUpTo', {
                  most: MOST_SMART_ENTRIES.toLocaleString(),
                }),
              }
            : {})}
          onValueChange={(next) => {
            onChange({ ...draft, limit: next });
          }}
        />
      </div>
    </div>
  );
};

SmartRulesEditor.displayName = 'SmartRulesEditor';

export { SmartRulesEditor };
