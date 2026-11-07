import { useEffect, useRef } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { PanelCard } from '@ValenceUI/PanelCard';
import { cn } from '@ValenceUI/cn';
import { PanelCardInfo } from '@ValenceScreens/components/PanelCardInfo/PanelCardInfo';
import { Badge } from '@ValenceUI/Badge';
import { SectionIndex } from '@ValenceUI/SectionIndex';
import { notify } from '@ValenceUI/notify';
import { sortKeyOf } from '@ValenceCore/functions/sortKeyOf';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { FIELDS_OF_KIND } from '@ValenceContracts/schemas/TitleEdit';
import { TITLE_VALUE_FIELDS } from '@ValenceContracts/schemas/TitleList';
import { textOfValue } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/textOfValue';
import { savesAfterMs } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/savesAfterMs';
import { useTitleChange } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/useTitleChange';
import { TITLE_FIELD_CARDS } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/TITLE_FIELD_CARDS';
import { MetadataField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/MetadataField/MetadataField';
import { CatalogueIdRow } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/CatalogueIdRow/CatalogueIdRow';
import type { TitleField, TitleMetadata, TitleValue } from '@ValenceContracts/schemas/TitleEdit';
import type { TitleFormProps } from './TitleForm.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const FULL_WIDTH: readonly TitleField[] = ['tagline', 'overview', 'note'];

const ANIME_ONLY: readonly TitleField[] = ['anilistId', 'malId'];

const HALF_WIDTH: readonly TitleField[] = [
  'title',
  'originalTitle',
  'sortTitle',
  'genres',
  'tags',
  'studios',
  'networks',
  'trailer',
  'countries',
  'creators',
  'directors',
  'writers',
];

const EVERY_FIELD: readonly TitleField[] = TITLE_FIELD_CARDS.flatMap((card) => card.fields);

/**
 * Says how wide a field starts out in its section's row, so each is as wide as what it holds — a
 * name or a list of words wide, a date, a score or an ID narrow, prose the whole row, the content
 * ratings the whole row once every country's is open — before every field in the row grows to share
 * what is left, so no row ever ends short of the card's edge.
 *
 * @param field - The field.
 * @param fields - Every field in its section.
 * @returns The classes that set how it is sized.
 */
const widthOf = (field: TitleField, fields: readonly TitleField[]): string =>
  cn(
    'min-w-0 grow',
    FULL_WIDTH.includes(field) || (field === 'studios' && !fields.includes('networks'))
      ? 'basis-full'
      : field === 'certifications'
        ? 'basis-[26rem] has-[[data-open]]:basis-full'
        : HALF_WIDTH.includes(field)
          ? 'basis-[22rem]'
          : 'basis-[11rem]',
  );

/**
 * Every field of a title as the server has it, for the form to start from and to follow.
 *
 * @param metadata - The title's metadata.
 * @returns Each field's value, nothing where the title has none.
 */
const valuesOf = (metadata: TitleMetadata): Partial<Record<TitleField, TitleValue>> =>
  Object.fromEntries(EVERY_FIELD.map((field) => [field, metadata.fields[field]?.value ?? null]));

/**
 * A title's metadata as one form, each section its own card down the page with what it is for
 * behind a mark at its right and how many of its fields have been changed by hand, and every section listed
 * down the side on a wide screen, the one being read marked, to jump between. The form holds every field, and each
 * field saves itself as it changes, a list of words at once and anything typed once the typing
 * stops. Where a save fails the field goes back to what was saved. Whatever the server answers —
 * a value it tidied, a field put back or locked, a change undone — comes into every field not
 * being typed in, and a field still waiting to save when the page is left is saved then.
 *
 * @param metadata - The title's metadata, as the server has it.
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param onShowHistory - Opens the title's history.
 * @param onFixMatch - Opens the dialog that fixes what the title is matched to, where it can be.
 * @param after - A section of the title's own to follow the metadata, such as its collections, listed
 *   with the rest.
 */
const TitleForm = ({
  metadata,
  mediaId,
  scope,
  onShowHistory,
  onFixMatch,
  after,
}: TitleFormProps) => {
  const { change } = useTitleChange(mediaId, scope);
  const { kind, libraryId } = metadata.subject;
  const has = FIELDS_OF_KIND[kind];
  const server = valuesOf(metadata);
  const serverNow = useRef(server);
  const unsent = useRef(new Map<TitleField, TitleValue>());
  const form = useForm({ defaultValues: server });
  const words = useQueries({
    queries: TITLE_VALUE_FIELDS.map((field) => ({
      ...adminQueries.titleValues(field, libraryId),
      enabled: FIELDS_OF_KIND[kind].includes(field),
    })),
  });
  const serverKey = JSON.stringify(server);

  useEffect(() => {
    serverNow.current = server;

    for (const field of EVERY_FIELD) {
      const value = server[field] ?? null;

      if (
        !unsent.current.has(field) &&
        JSON.stringify(form.getFieldValue(field) ?? null) !== JSON.stringify(value)
      ) {
        form.setFieldValue(field, value, {
          dontRunListeners: true,
          dontUpdateMeta: true,
          dontValidate: true,
        });
      }
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- follows the server's values by what they are, not by each render's copy of them
  }, [serverKey, form]);

  const save = (field: TitleField, value: TitleValue) => {
    void change({ set: { [field]: value } }).then((outcome) => {
      if (unsent.current.get(field) === value) {
        unsent.current.delete(field);
      }

      if (!outcome.isSaved) {
        notify.failed(outcome.reason);
        form.setFieldValue(field, serverNow.current[field] ?? null, {
          dontRunListeners: true,
          dontUpdateMeta: true,
          dontValidate: true,
        });
      }
    });
  };

  const saveRef = useRef(save);

  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(
    () => () => {
      for (const [field, value] of unsent.current) {
        saveRef.current(field, value);
      }
    },
    [],
  );

  const suggestionsOf = (field: TitleField) => {
    const at = TITLE_VALUE_FIELDS.findIndex((one) => one === field);

    return at < 0 ? undefined : words[at]?.data?.values;
  };

  const sections = TITLE_FIELD_CARDS.flatMap((card) => {
    const fields = card.fields.filter(
      (field) =>
        has.includes(field) &&
        (!ANIME_ONLY.includes(field) || (metadata.fields[field]?.value ?? null) !== null),
    );
    const changed = fields.filter((field) => {
      const source = metadata.fields[field]?.source;

      return source === 'edited' || source === 'locked';
    }).length;

    return fields.length === 0 ? [] : [{ card, fields, changed, id: `title-${card.id}` }];
  });

  const fieldOf = (field: TitleField, fields: readonly TitleField[]) => {
    const suggestions = suggestionsOf(field);

    return (
      <form.Field
        key={field}
        name={field}
        listeners={{
          onChange: ({ value }) => {
            save(field, value ?? null);
          },
          onChangeDebounceMs: savesAfterMs(field),
        }}
      >
        {(input) => (
          <MetadataField
            field={field}
            kind={kind}
            state={metadata.fields[field]}
            value={input.state.value ?? null}
            onValueChange={(value) => {
              unsent.current.set(field, value);
              input.handleChange(value);
            }}
            change={change}
            {...(onShowHistory === undefined ? {} : { onShowHistory })}
            {...(suggestions === undefined ? {} : { suggestions })}
            {...(metadata.certificationRegion === undefined
              ? {}
              : { region: metadata.certificationRegion })}
            {...(field === 'sortTitle'
              ? { placeholder: sortKeyOf(textOfValue(metadata.fields.title?.value ?? null)) }
              : field === 'trailer'
                ? { placeholder: say('screens.adminArea.titleDetails.aYouTubeLinkOrVideoId') }
                : {})}
            isLabelHidden={fields.length === 1}
            className={widthOf(field, fields)}
          />
        )}
      </form.Field>
    );
  };

  const changedNote = (count: number) =>
    count === 0 ? undefined : sayCount('client.admin.describeScanResult.changed', count);

  return (
    <div className="@container min-w-0">
      <div className="flex flex-col gap-5 @5xl:grid @5xl:grid-cols-[13rem_minmax(0,1fr)] @5xl:gap-8">
        <SectionIndex
          label={say('screens.adminArea.titleDetails.sectionsOfTheDetails')}
          sections={[
            ...sections.map(({ card, changed, id }) => {
              const note = changedNote(changed);

              return { id, label: card.title, ...(note === undefined ? {} : { note }) };
            }),
            ...(after === undefined ? [] : [{ id: 'title-after', label: after.label }]),
          ]}
          className="sticky top-[calc(var(--valence-window-bar,0px)+var(--admin-chrome,3.5rem)+1rem)] hidden self-start pt-1.5 @5xl:flex"
        />

        <div className="flex min-w-0 flex-col gap-5">
          {sections.map(({ card, fields, changed, id }) => {
            const note = changedNote(changed);

            return (
              <div
                key={card.id}
                id={id}
                className="scroll-mt-[calc(var(--valence-window-bar,0px)+var(--admin-chrome,3.5rem)+1rem)]"
              >
                <PanelCard
                  title={card.title}
                  {...(note === undefined && card.about === undefined
                    ? {}
                    : {
                        actions: (
                          <>
                            {note === undefined ? null : (
                              <Badge size="sm" tone="accent">
                                {note}
                              </Badge>
                            )}
                            {card.about === undefined ? null : (
                              <PanelCardInfo
                                label={say('screens.adminArea.statStrip.aboutLabel', {
                                  label: card.title,
                                })}
                                detail={card.about}
                              />
                            )}
                          </>
                        ),
                      })}
                >
                  <div className="flex flex-wrap gap-x-4 gap-y-5">
                    {card.id === 'ids' && (kind === 'film' || kind === 'show') ? (
                      <div className="min-w-0 grow basis-[22rem]">
                        <CatalogueIdRow
                          subjectKey={metadata.subject.key}
                          isShow={kind === 'show'}
                          {...(onFixMatch === undefined ? {} : { onFixMatch })}
                        />
                      </div>
                    ) : null}
                    {fields.map((field) => fieldOf(field, fields))}
                  </div>
                </PanelCard>
              </div>
            );
          })}

          {after === undefined ? null : (
            <div
              id="title-after"
              className="scroll-mt-[calc(var(--valence-window-bar,0px)+var(--admin-chrome,3.5rem)+1rem)]"
            >
              {after.content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

TitleForm.displayName = 'TitleForm';

export { TitleForm };
