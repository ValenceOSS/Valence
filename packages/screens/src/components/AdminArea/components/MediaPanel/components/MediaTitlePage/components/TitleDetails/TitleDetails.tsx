import { useQueries, useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { Spinner } from '@ValenceUI/Spinner';
import { cn } from '@ValenceUI/cn';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { FIELDS_OF_KIND } from '@ValenceContracts/schemas/TitleEdit';
import { TITLE_VALUE_FIELDS } from '@ValenceContracts/schemas/TitleList';
import { MetadataField } from './components/MetadataField/MetadataField';
import { TITLE_FIELD_CARDS } from './TITLE_FIELD_CARDS';
import { useTitleChange } from './useTitleChange';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';
import type { TitleDetailsProps } from './TitleDetails.types';
import { say } from '@ValenceI18n/say';

const SPANS_BOTH: readonly TitleField[] = [
  'overview',
  'note',
  'genres',
  'tags',
  'studios',
  'networks',
  'certifications',
];

/**
 * A title's Details tab: every field of its metadata, grouped into cards, each saved as it changes
 * and saying where its value came from.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param onShowHistory - Opens the title's history.
 */
const TitleDetails = ({ mediaId, scope, onShowHistory }: TitleDetailsProps) => {
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

  return (
    <div className="flex flex-col gap-4">
      {TITLE_FIELD_CARDS.flatMap((card) => {
        const fields = card.fields.filter((field) => has.includes(field));

        return fields.length === 0
          ? []
          : [
              <PanelCard key={card.id} title={card.title}>
                <div className="grid gap-4 sm:grid-cols-2">
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
                        className={cn(SPANS_BOTH.includes(field) ? 'sm:col-span-2' : '')}
                      />
                    );
                  })}
                </div>
              </PanelCard>,
            ];
      })}
    </div>
  );
};

TitleDetails.displayName = 'TitleDetails';

export { TitleDetails };
