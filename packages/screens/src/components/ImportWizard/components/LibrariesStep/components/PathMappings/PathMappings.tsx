import { useEffect, useState } from 'react';
import { Plus as PlusIcon, Bin as BinIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import type { PathMapping } from '@ValenceContracts/schemas/MediaImport';
import { say } from '@ValenceI18n/say';
import type { PathMappingsProps } from './PathMappings.types';

/**
 * Where the old server's folders are as Valence sees them, typed as pairs: a folder as the old
 * server names it and the same folder as Valence names it, since two containers rarely mount media
 * at the same path.
 *
 * @param sourceName - What the old server is called.
 * @param mappings - The pairs saved so far.
 * @param isSaving - Whether the pairs are being saved.
 * @param onSave - Told the pairs to save.
 */
const PathMappings = ({ sourceName, mappings, isSaving, onSave }: PathMappingsProps) => {
  const [rows, setRows] = useState<PathMapping[]>([...mappings]);

  useEffect(() => {
    setRows([...mappings]);
  }, [mappings]);

  const change = (index: number, patch: Partial<PathMapping>) => {
    setRows((held) => held.map((row, at) => (at === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-text-muted">
        {say('screens.importWizard.pathMappings.sourceAndValenceMaySeeTheSameFiles', {
          source: sourceName,
        })}
      </p>

      {rows.map((row, index) => (
        <div key={index} className="flex flex-wrap items-end gap-2">
          <TextField
            className="min-w-48 flex-1"
            label={say('screens.importWizard.pathMappings.onSource', { source: sourceName })}
            value={row.from}
            placeholder={say('screens.importWizard.pathMappings.sourceFolderExample')}
            onValueChange={(from) => {
              change(index, { from });
            }}
          />

          <TextField
            className="min-w-48 flex-1"
            label={say('screens.importWizard.pathMappings.inValence')}
            value={row.to}
            placeholder={say('screens.importWizard.pathMappings.valenceFolderExample')}
            onValueChange={(to) => {
              change(index, { to });
            }}
          />

          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            label={say('screens.importWizard.pathMappings.removeThisPair')}
            onClick={() => {
              setRows((held) => held.filter((_, at) => at !== index));
            }}
          >
            <Icon of={BinIcon} size={16} />
          </Button>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setRows((held) => [...held, { from: '', to: '' }]);
          }}
        >
          <Icon of={PlusIcon} size={16} />
          {say('screens.importWizard.pathMappings.addAFolder')}
        </Button>

        <Button
          variant="secondary"
          isLoading={isSaving}
          onClick={() => {
            onSave(rows.filter((row) => row.from.trim() !== '' && row.to.trim() !== ''));
          }}
        >
          {say('screens.importWizard.pathMappings.saveAndLookAgain')}
        </Button>
      </div>
    </div>
  );
};

PathMappings.displayName = 'PathMappings';

export { PathMappings };
