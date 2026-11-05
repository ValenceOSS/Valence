import { useState } from 'react';
import { Checkbox } from '@ValenceUI/Checkbox';
import { SelectField } from '@ValenceUI/SelectField';
import { SettingGroup } from '@ValenceUI/SettingGroup';
import { TextField } from '@ValenceUI/TextField';
import { labelOfField } from '@ValenceScreens/components/AdminArea/components/MediaPanel/components/MediaTitlePage/components/TitleDetails/labelOfField';
import type { BulkReplace } from '@ValenceContracts/schemas/BulkTitleEdit';
import type { FindReplaceProps } from './FindReplace.types';
import { say } from '@ValenceI18n/say';

/**
 * The bulk edit dialog's find and replace: words looked for in one field of every title chosen and
 * replaced with others, or taken out where nothing is given to put in their place.
 *
 * @param fields - The fields it can look in.
 * @param kind - What kind of title is being edited, which names the fields.
 * @param replace - The replacing asked for, or nothing.
 * @param onReplace - Told what is now asked, or nothing once the words to find are emptied.
 */
const FindReplace = ({ fields, kind, replace, onReplace }: FindReplaceProps) => {
  const [field, setField] = useState<BulkReplace['field']>(fields[0] ?? 'overview');
  const [find, setFind] = useState('');
  const [put, setPut] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const tell = (
    next: Partial<{ field: BulkReplace['field']; find: string; with: string; matchCase: boolean }>,
  ) => {
    const asked = { field, find, with: put, matchCase, ...next };

    onReplace(asked.find === '' ? null : asked);
  };

  return (
    <SettingGroup
      title={say('screens.adminArea.findAndReplace.findAndReplace')}
      description={say('screens.adminArea.findAndReplace.inAListOnlyWholeWords')}
    >
      <div className="grid items-end gap-4 @xl:grid-cols-2 @4xl:grid-cols-4">
        <SelectField
          label={say('screens.adminArea.findAndReplace.inWhichField')}
          options={fields.map((one) => ({ id: one, label: labelOfField(one, kind) }))}
          value={replace?.field ?? field}
          onSelect={(id) => {
            const chosen = fields.find((one) => one === id);

            if (chosen !== undefined) {
              setField(chosen);
              tell({ field: chosen });
            }
          }}
        />
        <TextField
          label={say('screens.adminArea.findAndReplace.find')}
          value={find}
          onValueChange={(typed) => {
            setFind(typed);
            tell({ find: typed });
          }}
        />
        <TextField
          label={say('screens.adminArea.findAndReplace.replaceWith')}
          value={put}
          onValueChange={(typed) => {
            setPut(typed);
            tell({ with: typed });
          }}
        />
        <Checkbox
          label={say('screens.adminArea.findAndReplace.matchCase')}
          checked={matchCase}
          onCheckedChange={(checked) => {
            setMatchCase(checked);
            tell({ matchCase: checked });
          }}
          className="pb-2"
        />
      </div>
    </SettingGroup>
  );
};

FindReplace.displayName = 'FindReplace';

export { FindReplace };
