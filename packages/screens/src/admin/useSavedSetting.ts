import { useEffect, useRef, useState } from 'react';
import { tellOutcome } from '@ValenceScreens/admin/tellOutcome';
import type { SavedSettingOptions } from './SavedSettingOptions';

/**
 * Holds one setting that saves as it changes: the change shows at once, is saved, and is answered
 * with a toast, and the saved value comes back where the save fails. Given a delay, a typed value
 * is held until the typing stops, so a name is saved once rather than once a letter, and is still
 * saved if the page is left before then. Once saved, the held value gives way to whatever the
 * server answers next, even where the server tidied it.
 *
 * @param saved - The value as saved.
 * @param save - Saves a value, answering whether it worked.
 * @param options - What to say when it saves or fails, or how to say it instead, how long to wait,
 *   and what to do once saved.
 * @returns The value to show, and how to change it.
 */
const useSavedSetting = <Value>(
  saved: Value,
  save: (value: Value) => Promise<boolean>,
  { done, failed, delayMs = 0, onSaved, tells }: SavedSettingOptions,
): [Value, (value: Value) => void] => {
  const [held, setHeld] = useState<{ value: Value; savedFrom: string | null } | null>(null);
  const waiting = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sending = useRef<(() => void) | null>(null);
  const savedKey = JSON.stringify(saved);
  const savedNow = useRef(savedKey);
  const isHeldSaved =
    held !== null &&
    (JSON.stringify(held.value) === savedKey ||
      (held.savedFrom !== null && held.savedFrom !== savedKey));

  useEffect(() => {
    savedNow.current = savedKey;
  }, [savedKey]);

  useEffect(() => {
    if (isHeldSaved) {
      setHeld(null);
    }
  }, [isHeldSaved]);

  useEffect(
    () => () => {
      if (waiting.current !== null) {
        clearTimeout(waiting.current);
        sending.current?.();
      }
    },
    [],
  );

  const change = (value: Value) => {
    setHeld({ value, savedFrom: null });

    if (waiting.current !== null) {
      clearTimeout(waiting.current);
    }

    const send = () => {
      waiting.current = null;
      sending.current = null;

      const savedFrom = savedNow.current;

      void save(value).then((isSaved) => {
        if (tells === undefined) {
          tellOutcome(done, isSaved ? null : failed);
        } else {
          tells(isSaved);
        }

        if (isSaved) {
          setHeld((now) => (now?.value === value ? { value, savedFrom } : now));
          onSaved?.();
        } else {
          setHeld(null);
        }
      });
    };

    if (delayMs === 0) {
      send();
    } else {
      sending.current = send;
      waiting.current = setTimeout(send, delayMs);
    }
  };

  return [held === null ? saved : held.value, change];
};

export { useSavedSetting };
