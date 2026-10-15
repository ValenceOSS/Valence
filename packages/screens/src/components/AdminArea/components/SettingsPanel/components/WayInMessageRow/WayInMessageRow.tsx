import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { saveWayInMessage } from '@ValenceClient/admin/fetchAdmin';
import { WAY_IN_MESSAGE_LIMIT } from '@ValenceContracts/schemas/WayInMessage';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { WayInMessageRowProps } from './WayInMessageRow.types';
import { say } from '@ValenceI18n/say';

const A_HEX_COLOUR = /^#[0-9a-fA-F]{6}$/u;

/**
 * The message the sign in and profile pages show under their question, written here with a colour
 * of its own where one is wanted: any six digit hex code, previewed as it is typed, or the theme's
 * own colour where the field is left empty.
 *
 * @param message - The message as it stands, or null where there is none.
 */
const WayInMessageRow = ({ message }: WayInMessageRowProps) => {
  const [text, setText] = useState(message?.text ?? '');
  const [colour, setColour] = useState(message?.colour ?? '');
  const [hasOne, setHasOne] = useState(message !== null);
  const [isSaving, setIsSaving] = useState(false);
  const isColourWrong = colour.trim() !== '' && !A_HEX_COLOUR.test(colour.trim());

  const save = (next: { text: string; colour: string | null } | null) => {
    setIsSaving(true);

    void saveWayInMessage(next).then((saved) => {
      setIsSaving(false);

      if (
        tellOutcome(
          next === null
            ? say('screens.adminArea.wayInMessageRow.messageRemoved')
            : say('screens.adminArea.wayInMessageRow.messageSaved'),
          saved ? null : say('screens.adminArea.wayInMessageRow.messageCouldNotBeSaved'),
        )
      ) {
        setHasOne(next !== null);

        if (next === null) {
          setText('');
          setColour('');
        }
      }
    });
  };

  return (
    <SettingRow
      title={say('screens.adminArea.wayInMessageRow.messageOnTheWayIn')}
      description={say('screens.adminArea.wayInMessageRow.shownUnderWhoIsWatching')}
    >
      <div className="flex w-full max-w-md flex-col gap-3">
        <TextField
          label={say('screens.adminArea.sessionCard.message')}
          value={text}
          onValueChange={(next) => {
            setText(next.slice(0, WAY_IN_MESSAGE_LIMIT));
          }}
          size="sm"
        />

        <TextField
          label={say('common.colour')}
          description={say('screens.adminArea.wayInMessageRow.aHexCodeOrEmpty')}
          value={colour}
          onValueChange={setColour}
          size="sm"
          {...(isColourWrong
            ? { error: say('screens.adminArea.wayInMessageRow.useASixDigitHexCode') }
            : {})}
          trailing={
            A_HEX_COLOUR.test(colour.trim()) ? (
              <span
                aria-hidden
                className="size-4 rounded-full border border-[var(--surface-line)]"
                style={{ backgroundColor: colour.trim() }}
              />
            ) : null
          }
        />

        <span className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isSaving}
            disabled={isSaving || text.trim() === '' || isColourWrong}
            onClick={() => {
              save({ text: text.trim(), colour: colour.trim() === '' ? null : colour.trim() });
            }}
          >
            {say('screens.adminArea.wayInMessageRow.saveMessage')}
          </Button>

          {hasOne ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={() => {
                save(null);
              }}
            >
              {say('common.forget')}
            </Button>
          ) : null}
        </span>
      </div>
    </SettingRow>
  );
};

WayInMessageRow.displayName = 'WayInMessageRow';

export { WayInMessageRow };
