import { Plus as PlusIcon } from '@keyline-icons/react';
import { Bin as BinFilledIcon } from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import type { ArrPathMappingsFormProps } from './ArrPathMappingsForm.types';
import { say } from '@ValenceI18n/say';

/**
 * Where the apps' folders are as Valence sees them: each a folder as Radarr, Sonarr or Lidarr
 * writes it beside the same folder as Valence does, for matching root folders to libraries and
 * download folders to Valence's own.
 *
 * @param mappings - The mappings.
 * @param isDisabled - Whether they are locked while the setup is read or brought in.
 * @param onChange - Called with the mappings as changed.
 */
const ArrPathMappingsForm = ({ mappings, isDisabled, onChange }: ArrPathMappingsFormProps) => (
  <div className="flex flex-col gap-2">
    {mappings.map((mapping, index) => (
      <div key={index} className="grid items-end gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <TextField
          label={say('screens.importWizard.arrImportStep.folderAsTheAppsSeeIt')}
          size="sm"
          placeholder="/movies"
          value={mapping.from}
          disabled={isDisabled}
          onValueChange={(from) => {
            onChange(mappings.map((one, at) => (at === index ? { ...one, from } : one)));
          }}
        />
        <TextField
          label={say('screens.importWizard.arrImportStep.sameFolderAsValenceSeesIt')}
          size="sm"
          placeholder="/media/Films"
          value={mapping.to}
          disabled={isDisabled}
          onValueChange={(to) => {
            onChange(mappings.map((one, at) => (at === index ? { ...one, to } : one)));
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={say('screens.importWizard.arrImportStep.removeThisMapping')}
          disabled={isDisabled}
          onClick={() => {
            onChange(mappings.filter((_, at) => at !== index));
          }}
        >
          <Icon of={BinFilledIcon} size={14} />
        </Button>
      </div>
    ))}

    <Button
      variant="ghost"
      size="xs"
      className="self-start"
      disabled={isDisabled}
      onClick={() => {
        onChange([...mappings, { from: '', to: '' }]);
      }}
    >
      {say('screens.importWizard.arrImportStep.addAMapping')}
      <Icon of={PlusIcon} size={14} />
    </Button>
  </div>
);

ArrPathMappingsForm.displayName = 'ArrPathMappingsForm';

export { ArrPathMappingsForm };
