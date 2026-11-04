import { useRef, useState } from 'react';
import {
  Bin as BinFilledIcon,
  Lock as LockFilledIcon,
  Plus as PlusFilledIcon,
  Unlock as UnlockFilledIcon,
} from '@keyline-icons/react/fill';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { PanelCard } from '@ValenceUI/PanelCard';
import { TextField } from '@ValenceUI/TextField';
import { PanelCardAction } from '@ValenceScreens/components/PanelCardAction/PanelCardAction';
import { isBadHeader } from './isBadHeader';
import type { CustomWebhookHeader } from '@ValenceContracts/schemas/Webhook';
import type { CustomHeadersCardProps } from './CustomHeadersCard.types';
import { say } from '@ValenceI18n/say';

const SETTLES_MS = 700;

const HIDDEN = '••••••••';

/**
 * The Custom service's own headers, a row each, with a lock for a value to keep hidden once saved.
 * Headers save a moment after typing stops, and none save while any has no name yet or could not be
 * sent, so a header half-way through a change is never dropped.
 *
 * @param saved - The headers as saved, a hidden value coming back empty.
 * @param onSave - Saves the headers, answering whether it worked.
 */
const CustomHeadersCard = ({ saved, onSave }: CustomHeadersCardProps) => {
  const [edited, setEdited] = useState<CustomWebhookHeader[] | null>(null);
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shown = edited ?? saved;

  const change = (next: CustomWebhookHeader[]) => {
    setEdited(next);

    if (waiting.current !== null) {
      clearTimeout(waiting.current);
    }

    if (next.some((one) => one.name.trim() === '' || isBadHeader(one))) {
      return;
    }

    waiting.current = setTimeout(() => {
      void onSave(next).then((isSaved) => {
        if (isSaved) {
          setEdited((now) => (now === next ? null : now));
        }
      });
    }, SETTLES_MS);
  };

  const changeOne = (at: number, patch: Partial<CustomWebhookHeader>) => {
    change(shown.map((one, index) => (index === at ? { ...one, ...patch } : one)));
  };

  return (
    <PanelCard
      title={say('screens.adminArea.customHeadersCard.headers')}
      isFlush
      actions={
        <PanelCardAction
          icon={PlusFilledIcon}
          onClick={() => {
            setEdited([...shown, { name: '', value: '', isSecret: false }]);
          }}
        >
          {say('screens.adminArea.customHeadersCard.addHeader')}
        </PanelCardAction>
      }
    >
      {shown.length === 0 ? (
        <p className="px-5 py-4 text-[0.8125rem] text-text-muted">
          {say('screens.adminArea.customHeadersCard.noneYetAddOneForA')}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[var(--surface-line)]">
          {shown.map((header, index) => (
            <li key={index} className="flex flex-col gap-1.5 px-5 py-3">
              <div className="flex items-center gap-2">
                <TextField
                  label={say('common.name')}
                  isLabelHidden
                  size="sm"
                  placeholder={say('common.name')}
                  value={header.name}
                  onValueChange={(name) => {
                    changeOne(index, { name });
                  }}
                  className="w-56 shrink-0"
                />
                <TextField
                  label={say('screens.profileEditor.customFormats.value')}
                  isLabelHidden
                  size="sm"
                  type={header.isSecret ? 'password' : 'text'}
                  placeholder={
                    header.isSecret ? HIDDEN : say('screens.profileEditor.customFormats.value')
                  }
                  value={header.value}
                  onValueChange={(value) => {
                    changeOne(index, { value });
                  }}
                  className="min-w-0 flex-1"
                />
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  label={
                    header.isSecret
                      ? say('screens.adminArea.customHeadersCard.showThisValue')
                      : say('screens.adminArea.customHeadersCard.hideThisValueOnceSaved')
                  }
                  onClick={() => {
                    changeOne(index, { isSecret: !header.isSecret });
                  }}
                >
                  <Icon of={header.isSecret ? LockFilledIcon : UnlockFilledIcon} size={15} />
                </Button>
                <Button
                  isIconOnly
                  variant="ghost"
                  size="sm"
                  label={say('screens.adminArea.customHeadersCard.removeThisHeader')}
                  onClick={() => {
                    change(shown.filter((_one, other) => other !== index));
                  }}
                >
                  <Icon of={BinFilledIcon} size={15} />
                </Button>
              </div>
              {isBadHeader(header) ? (
                <span className="text-xs text-danger">
                  {say('screens.adminArea.customHeadersCard.aNameIsLettersNumbersAndDashes')}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </PanelCard>
  );
};

CustomHeadersCard.displayName = 'CustomHeadersCard';

export { CustomHeadersCard };
