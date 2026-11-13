import { useMemo, useState } from 'react';
import { ArrowRight as ArrowRightIcon } from '@keyline-icons/react';
import { artworkUrl } from '@ValenceClient/library/artworkUrl';
import { Badge } from '@ValenceUI/Badge';
import { Checkbox } from '@ValenceUI/Checkbox';
import { DataTable } from '@ValenceUI/DataTable';
import { Icon } from '@ValenceUI/Icon';
import { Switch } from '@ValenceUI/Switch';
import { MediaPoster } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaPoster/MediaPoster';
import { describeTitleValue } from '@ValenceScreens/components/AdminArea/components/SourcedField/describeTitleValue';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import { isSameTitleValue } from '@ValenceCore/functions/isSameTitleValue';
import type { DataTableColumn } from '@ValenceUI/DataTable.types';
import type { MatchPreview } from '@ValenceContracts/schemas/TitleEdit';
import type { MatchCompareProps } from './MatchCompare.types';
import { say } from '@ValenceI18n/say';

type Row = MatchPreview['rows'][number];

/**
 * A title beside the catalogue entry it is about to be matched to: the poster as it is and as it
 * would be, then a row for each field with its value now and the entry's, ticked where the new
 * value is to be taken. Fields that would stay the same wait behind a switch.
 *
 * @param mediaId - A file of the title, whose poster is drawn as it is.
 * @param preview - The comparison.
 * @param taken - The fields that take the entry's value.
 * @param onTake - Told a field is to take the entry's value, or keep its own.
 */
const MatchCompare = ({ mediaId, preview, taken, onTake }: MatchCompareProps) => {
  const [showsUnchanged, setShowsUnchanged] = useState(false);
  const changed = preview.rows.filter((row) => !isSameTitleValue(row.current.value, row.next));
  const shown = showsUnchanged ? preview.rows : changed;

  const columns = useMemo<DataTableColumn<Row>[]>(
    () => [
      {
        id: 'take',
        header: '',
        enableSorting: false,
        meta: { shrinks: true },
        cell: ({ row }) => {
          const label = labelOfField(row.original.field, preview.kind);

          return (
            <Checkbox
              label={say('screens.adminArea.fixMatchDialog.takeTheNewField', { field: label })}
              isLabelHidden
              checked={taken.has(row.original.field)}
              disabled={isSameTitleValue(row.original.current.value, row.original.next)}
              onCheckedChange={(isTaken) => {
                onTake(row.original.field, isTaken);
              }}
            />
          );
        },
      },
      {
        id: 'field',
        header: say('screens.adminArea.fixMatchDialog.field'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="flex items-center gap-2 whitespace-nowrap text-sm text-text">
            {labelOfField(row.original.field, preview.kind)}
            {row.original.current.source === 'edited' ? (
              <Badge size="sm" tone="accent">
                {say('screens.adminArea.sourcedField.edited')}
              </Badge>
            ) : row.original.current.source === 'locked' ? (
              <Badge size="sm" tone="accent">
                {say('screens.adminArea.sourcedField.locked')}
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        id: 'current',
        header: say('screens.adminArea.fixMatchDialog.current'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-72 text-sm text-text-muted">
            {describeTitleValue(row.original.current.value)}
          </span>
        ),
      },
      {
        id: 'next',
        header: say('screens.profileEditor.readProfileForm.new'),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-72 text-sm text-text">
            {describeTitleValue(row.original.next)}
          </span>
        ),
      },
    ],
    [preview.kind, taken, onTake],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <MediaPoster className="w-20" src={artworkUrl(mediaId, 'poster', { size: 'small' })} />
        <Icon of={ArrowRightIcon} size={16} tone="muted" />
        <MediaPoster className="w-20" src={preview.posterUrl} />

        <span className="ms-auto flex items-center gap-2.5">
          <span aria-hidden className="text-sm text-text-muted">
            {say('screens.adminArea.fixMatchDialog.showUnchanged')}
          </span>
          <Switch
            label={say('screens.adminArea.fixMatchDialog.showUnchanged')}
            isLabelHidden
            isOn={showsUnchanged}
            onToggle={() => {
              setShowsUnchanged(!showsUnchanged);
            }}
          />
        </span>
      </div>

      {shown.length === 0 ? (
        <p className="font-body text-sm text-text-muted">
          {say('screens.adminArea.fixMatchDialog.nothingWouldChange')}
        </p>
      ) : (
        <DataTable
          label={say('screens.adminArea.fixMatchDialog.stepCompare')}
          columns={columns}
          rows={shown}
          getRowId={(row) => row.field}
          height="compact"
        />
      )}
    </div>
  );
};

MatchCompare.displayName = 'MatchCompare';

export { MatchCompare };
