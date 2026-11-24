import { useState } from 'react';
import { Button } from '@ValenceUI/Button';
import { StreamLimitCard } from '@ValenceScreens/components/AdminArea/components/StreamLimitCard/StreamLimitCard';
import { readTypedStreamLimit } from '@ValenceScreens/admin/readTypedStreamLimit';
import { typedStreamLimitOf } from '@ValenceScreens/admin/typedStreamLimitOf';
import type { TypedStreamLimit } from '@ValenceScreens/components/AdminArea/components/StreamLimitCard/StreamLimitCard.types';
import type { StreamLimitEditorProps } from './StreamLimitEditor.types';
import { say } from '@ValenceI18n/say';

/**
 * How much something may stream — its highest quality, bitrate and streams at once — with whatever
 * the caller has to say about it above, such as an account's streams now or what its roles hold it
 * to, and a button saving them.
 *
 * @param own - The limit as it is saved.
 * @param onSave - Told the limit to save, answering whether it was.
 * @param children - What to say above the card.
 */
const StreamLimitEditor = ({ own, onSave, children }: StreamLimitEditorProps) => {
  const [typed, setTyped] = useState<TypedStreamLimit | null>(null);
  const [said, setSaid] = useState<string | null>(null);
  const shown = typed ?? typedStreamLimitOf(own);
  const { maxBitrateKbps, maxStreams, maxQuality, limitsDownloads } = readTypedStreamLimit(shown);

  return (
    <div className="flex flex-col gap-4">
      <StreamLimitCard typed={shown} onChange={setTyped}>
        {children}
      </StreamLimitCard>

      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={typed === null || maxBitrateKbps === undefined || maxStreams === undefined}
          onClick={() => {
            if (maxBitrateKbps === undefined || maxStreams === undefined) {
              return;
            }

            void onSave({ maxBitrateKbps, maxStreams, maxQuality, limitsDownloads }).then(
              (saved) => {
                setSaid(
                  saved
                    ? say('screens.adminArea.accountStreamLimits.saved')
                    : say('screens.adminArea.accountStreamLimits.couldNotSave'),
                );

                if (saved) {
                  setTyped(null);
                }
              },
            );
          }}
        >
          {say('common.save')}
        </Button>

        {said === null ? null : (
          <p role="status" className="text-sm text-text-muted">
            {said}
          </p>
        )}
      </div>
    </div>
  );
};

StreamLimitEditor.displayName = 'StreamLimitEditor';

export { StreamLimitEditor };
