import { useQueries, useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { sortKeyOf } from '@ValenceCore/functions/sortKeyOf';
import { textOfValue } from './textOfValue';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { FIELDS_OF_KIND } from '@ValenceContracts/schemas/TitleEdit';
import { TITLE_VALUE_FIELDS } from '@ValenceContracts/schemas/TitleList';
import { MetadataField } from './components/MetadataField/MetadataField';
import { CatalogueIdRow } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/components/CatalogueIdRow/CatalogueIdRow';
import { TITLE_FIELD_CARDS } from './TITLE_FIELD_CARDS';
import { useTitleChange } from './useTitleChange';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { TitleDetailsProps } from './TitleDetails.types';
import { say } from '@ValenceI18n/say';

const SPANS_BOTH: readonly TitleField[] = ['tagline', 'overview', 'note', 'certifications'];

/**
 * A title's Details tab: every field of its metadata, grouped into cards, each saved as it changes
 * and saying where its value came from.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param onShowHistory - Opens the title's history.
 * @param onFixMatch - Opens the dialog that fixes what the title is matched to, where it can be.
 */
const TitleDetails = ({ mediaId, scope, onShowHistory, onFixMatch }: TitleDetailsProps) => {
  const metadata = useQuery(adminQueries.titleMetadata(mediaId, scope));
  const { change } = useTitleChange(mediaId, scope);
  const subject = metadata.data?.subject;
  const words = useQueries({
    queries: TITLE_VALUE_FIELDS.map((field) => ({
      ...adminQueries.titleValues(field, subject?.libraryId),
      enabled: subject !== undefined && FIELDS_OF_KIND[subject.kind].includes(field),
    })),
  });
  const suggestionsOf = (field: TitleField) => {
    const at = TITLE_VALUE_FIELDS.findIndex((one) => one === field);

    return at < 0 ? undefined : words[at]?.data?.values;
  };

  if (metadata.isPending) {
    return <Spinner isCentered size="sm" label={say('common.loading')} />;
  }

  if (metadata.isError) {
    return (
      <CouldNotRead
        said={say('screens.adminArea.titleDetails.theDetailsCouldNotBeRead')}
        why={metadata.error.message}
        onTryAgain={() => {
          void metadata.refetch();
        }}
        isTryingAgain={metadata.isFetching}
      />
    );
  }

  const { kind } = metadata.data.subject;
  const has = FIELDS_OF_KIND[kind];

  /**
   * Draws one card of fields, the fields side by side where it is in the main column.
   *
   * @param card - The card.
   * @returns The card, or nothing where the title has none of its fields.
   */
  const cardOf = (card: (typeof TITLE_FIELD_CARDS)[number]) => {
    const fields = card.fields.filter((field) => has.includes(field));
    const isSideBySide = card.isAside !== true;

    const [only] = fields;

    if (fields.length === 1 && only !== undefined && card.id !== 'ids') {
      return (
        <MetadataField
          key={card.id}
          field={only}
          kind={kind}
          state={metadata.data.fields[only]}
          change={change}
          isCard
          {...(onShowHistory === undefined ? {} : { onShowHistory })}
          {...(metadata.data.certificationRegion === undefined
            ? {}
            : { region: metadata.data.certificationRegion })}
        />
      );
    }

    return fields.length === 0 ? null : (
      <PanelCard key={card.id} title={card.title}>
        <div className={cn('grid gap-4', isSideBySide ? '@xl:grid-cols-2' : '')}>
          {card.id === 'ids' && (kind === 'film' || kind === 'show') ? (
            <CatalogueIdRow
              subjectKey={metadata.data.subject.key}
              isShow={kind === 'show'}
              {...(onFixMatch === undefined ? {} : { onFixMatch })}
            />
          ) : null}
          {fields.map((field) => {
            const suggestions = suggestionsOf(field);

            return (
              <MetadataField
                key={field}
                field={field}
                kind={kind}
                state={metadata.data.fields[field]}
                change={change}
                {...(onShowHistory === undefined ? {} : { onShowHistory })}
                {...(suggestions === undefined ? {} : { suggestions })}
                {...(metadata.data.certificationRegion === undefined
                  ? {}
                  : { region: metadata.data.certificationRegion })}
                {...(field === 'sortTitle'
                  ? {
                      placeholder: sortKeyOf(
                        textOfValue(metadata.data.fields.title?.value ?? null),
                      ),
                    }
                  : {})}
                className={cn(isSideBySide && SPANS_BOTH.includes(field) ? '@xl:col-span-2' : '')}
              />
            );
          })}
        </div>
      </PanelCard>
    );
  };

  const main = TITLE_FIELD_CARDS.filter((card) => card.isAside !== true).map(cardOf);
  const aside = TITLE_FIELD_CARDS.filter((card) => card.isAside === true).map(cardOf);

  return (
    <div className="@container">
      <div className="grid items-start gap-4 @5xl:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="@container flex min-w-0 flex-col gap-4">{main}</div>
        <div className="@container flex min-w-0 flex-col gap-4">{aside}</div>
      </div>
    </div>
  );
};

TitleDetails.displayName = 'TitleDetails';

export { TitleDetails };
