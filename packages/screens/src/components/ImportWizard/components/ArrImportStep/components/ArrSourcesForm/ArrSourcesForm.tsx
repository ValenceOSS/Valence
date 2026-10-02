import { Plus as PlusIcon } from '@keyline-icons/react';
import { Bin as BinFilledIcon } from '@keyline-icons/react/fill';
import { ActionMenu } from '@ValenceUI/ActionMenu';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { SegmentedRow } from '@ValenceUI/SegmentedRow';
import { TextField } from '@ValenceUI/TextField';
import { ARR_IMPORT_SOURCE_NAMES } from '@ValenceContracts/constants/ARR_IMPORT_SOURCE_NAMES';
import { ARR_IMPORT_SOURCE_KINDS } from '@ValenceContracts/schemas/ArrImport';
import type { ArrSourcesFormProps } from './ArrSourcesForm.types';
import { say } from '@ValenceI18n/say';

const USUAL_ADDRESSES = {
  radarr: 'http://radarr:7878',
  sonarr: 'http://sonarr:8989',
  lidarr: 'http://lidarr:8686',
  prowlarr: 'http://prowlarr:9696',
  overseerr: 'http://overseerr:5055',
  jellyseerr: 'http://jellyseerr:5055',
} as const;

const SEERR_KINDS = [
  { id: 'overseerr', label: ARR_IMPORT_SOURCE_NAMES.overseerr },
  { id: 'jellyseerr', label: ARR_IMPORT_SOURCE_NAMES.jellyseerr },
] as const;

/**
 * The apps a setup is brought in from, one row each: where it answers and its API key, Overseerr
 * or Jellyseerr told apart by a switch, more of any kind added from a menu — a second Radarr for
 * 4K, say — and any row past the first of its kind removable.
 *
 * @param rows - The apps.
 * @param isDisabled - Whether the rows are locked while the setup is read or brought in.
 * @param onChange - Called with what changed in a row.
 * @param onAdd - Called to add a row of a kind.
 * @param onRemove - Called to remove a row.
 */
const ArrSourcesForm = ({ rows, isDisabled, onChange, onAdd, onRemove }: ArrSourcesFormProps) => (
  <div className="flex flex-col gap-4">
    {rows.map((row, index) => {
      const name = ARR_IMPORT_SOURCE_NAMES[row.kind];
      const isSeerr = row.kind === 'overseerr' || row.kind === 'jellyseerr';
      const isExtra = rows.findIndex((other) => other.kind === row.kind) !== index;

      return (
        <div key={row.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {isSeerr ? (
              <SegmentedRow
                label={say('screens.importWizard.arrImportStep.whichRequestApp')}
                size="xs"
                items={SEERR_KINDS}
                value={row.kind}
                onSelect={(kind) => {
                  onChange(row.id, { kind: kind === 'jellyseerr' ? 'jellyseerr' : 'overseerr' });
                }}
              />
            ) : (
              <span className="text-sm font-medium text-text">{name}</span>
            )}

            {isExtra ? (
              <Button
                variant="ghost"
                size="xs"
                disabled={isDisabled}
                onClick={() => {
                  onRemove(row.id);
                }}
              >
                <Icon of={BinFilledIcon} size={14} />
                {say('phone.theAccount.theSecurity.removeName2', { name })}
              </Button>
            ) : null}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <TextField
              label={say('screens.importWizard.arrImportStep.nameAddress', { name })}
              type="url"
              autoComplete="url"
              size="sm"
              placeholder={USUAL_ADDRESSES[row.kind]}
              value={row.url}
              disabled={isDisabled}
              onValueChange={(url) => {
                onChange(row.id, { url });
              }}
            />
            <TextField
              label={say('screens.importWizard.arrImportStep.nameApiKey', { name })}
              type="password"
              size="sm"
              autoComplete="new-password"
              value={row.apiKey}
              disabled={isDisabled}
              onValueChange={(apiKey) => {
                onChange(row.id, { apiKey });
              }}
            />
          </div>
        </div>
      );
    })}

    <ActionMenu
      label={say('screens.importWizard.arrImportStep.addAnotherApp')}
      isDisabled={isDisabled}
      trigger={
        <span className="flex items-center gap-1.5 text-sm">
          <Icon of={PlusIcon} size={14} />
          {say('screens.importWizard.arrImportStep.addAnotherApp')}
        </span>
      }
      groups={[
        {
          items: ARR_IMPORT_SOURCE_KINDS.filter((kind) => kind !== 'jellyseerr').map((kind) => ({
            id: kind,
            label: ARR_IMPORT_SOURCE_NAMES[kind],
            onChoose: () => {
              onAdd(kind);
            },
          })),
        },
      ]}
    />
  </div>
);

ArrSourcesForm.displayName = 'ArrSourcesForm';

export { ArrSourcesForm };
