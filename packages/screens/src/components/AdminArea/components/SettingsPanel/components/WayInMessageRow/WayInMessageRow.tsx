import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { SettingRow } from '@ValenceUI/SettingRow';
import { TextField } from '@ValenceUI/TextField';
import { ColourChoice } from '@ValenceScreens/components/ColourChoice/ColourChoice';
import { saveWayInMessage } from '@ValenceClient/admin/fetchAdmin';
import { WAY_IN_MESSAGE_LIMIT } from '@ValenceContracts/schemas/WayInMessage';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { WayInMessageRowProps } from './WayInMessageRow.types';
import { say } from '@ValenceI18n/say';

/**
 * The message the sign in and profile pages show under their question, written here with a colour
 * of its own where one is wanted, picked from the ready colours or any other, or the theme's own
 * colour where none is picked.
 *
 * @param message - The message as it stands, or null where there is none.
 */
const WayInMessageRow = ({ message }: WayInMessageRowProps) => {
  const [text, setText] = useState(message?.text ?? '');
  const [colour, setColour] = useState(message?.colour ?? '');
  const [hasOne, setHasOne] = useState(message !== null);
  const [isSaving, setIsSaving] = useState(false);

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
          autoComplete="off"
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-[0.8125rem] font-medium text-text">{say('common.colour')}</span>

          <div className="flex flex-wrap items-center gap-2.5">
            <ColourChoice label={say('common.colour')} value={colour} onChange={setColour} />

            {colour === '' ? null : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setColour('');
                }}
              >
                {say('screens.adminArea.wayInMessageRow.useTheThemesColour')}
              </Button>
            )}
          </div>
        </div>

        <span className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isSaving}
            disabled={isSaving || text.trim() === ''}
            onClick={() => {
              save({ text: text.trim(), colour: colour === '' ? null : colour });
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
