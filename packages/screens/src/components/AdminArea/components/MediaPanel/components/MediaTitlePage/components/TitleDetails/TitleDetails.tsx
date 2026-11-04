import { useQueries, useQuery } from '@tanstack/react-query';
import { CouldNotRead } from '@ValenceUI/CouldNotRead';
import { PanelCard } from '@ValenceUI/PanelCard';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { SettingList } from '@ValenceUI/SettingList';
import { Spinner } from '@ValenceUI/Spinner';
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

const FULL_WIDTH: readonly TitleField[] = ['tagline', 'overview', 'note'];

const HALF_WIDTH: readonly TitleField[] = [
  'title',
  'originalTitle',
  'sortTitle',
  'genres',
  'tags',
  'studios',
  'networks',
];

/**
 * Says how much of a section's row a field takes, so each is as wide as what it holds: a name or a
 * list of words half the row, a date, a score or an ID a quarter, prose all of it, and the content
 * ratings all of it once every country's is open.
 *
 * @param field - The field.
 * @param fields - Every field in its section.
 * @returns The classes that set its width.
 */
const widthOf = (field: TitleField, fields: readonly TitleField[]): string =>
  FULL_WIDTH.includes(field) || (field === 'studios' && !fields.includes('networks'))
    ? 'col-span-full'
    : field === 'certifications'
      ? '@xl:col-span-2 has-[[data-open]]:col-span-full'
      : HALF_WIDTH.includes(field)
        ? '@xl:col-span-2'
        : '';

/**
 * A title's Details tab: every field of its metadata in one card, grouped into sections, each saved as it changes
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
   * Draws one section of fields, a field the only one of its section standing without a heading
   * since its own label already says what it is.
   *
   * @param card - The section.
   * @returns The section, or nothing where the title has none of its fields.
   */
  const sectionOf = (card: (typeof TITLE_FIELD_CARDS)[number]) => {
    const fields = card.fields.filter((field) => has.includes(field));
    const fieldOf = (field: TitleField) => {
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
            ? { placeholder: sortKeyOf(textOfValue(metadata.data.fields.title?.value ?? null)) }
            : {})}
          className={widthOf(field, fields)}
        />
      );
    };

    const [only] = fields;

    if (fields.length === 1 && only !== undefined && card.id !== 'ids') {
      return (
        <div key={card.id} className="py-4">
          {fieldOf(only)}
        </div>
      );
    }

    return fields.length === 0 ? null : (
      <SettingGroup key={card.id} title={card.title}>
        <div className="grid gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
          {card.id === 'ids' && (kind === 'film' || kind === 'show') ? (
            <CatalogueIdRow
              subjectKey={metadata.data.subject.key}
              isShow={kind === 'show'}
              {...(onFixMatch === undefined ? {} : { onFixMatch })}
            />
          ) : null}
          {fields.map(fieldOf)}
        </div>
      </SettingGroup>
    );
  };

  return (
    <div className="@container min-w-0">
      <PanelCard title={say('common.details')}>
        <SettingList>{TITLE_FIELD_CARDS.map(sectionOf)}</SettingList>
      </PanelCard>
    </div>
  );
};

TitleDetails.displayName = 'TitleDetails';

export { TitleDetails };
