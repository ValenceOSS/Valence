import { useEffect, useRef, useState } from 'react';
import { Prompt } from '@ValenceTv/components/Prompt/Prompt';
import { putThePromptAway, whenPrompted } from '@ValenceTv/navigation/prompts';
import type { Prompt as Asked } from '@ValenceTv/navigation/prompts';

/**
 * Draws whatever question has been put on the screen, over everything else, and hands the remote
 * back to what had it once the question is answered.
 *
 * A television's own alerts need none of this; it is what a television's browser shows in their
 * place, since a browser has no alert of its own that a remote can answer.
 */
const PromptHost = () => {
  const [asked, setAsked] = useState<Asked | null>(null);
  const before = useRef<Element | null>(null);

  useEffect(
    () =>
      whenPrompted((prompt) => {
        if (prompt !== null && typeof document !== 'undefined') {
          before.current = document.activeElement;
        }

        setAsked(prompt);
      }),
    [],
  );

  if (asked === null) {
    return null;
  }

  return (
    <Prompt
      prompt={asked}
      onAnswered={() => {
        putThePromptAway();

        if (before.current instanceof HTMLElement && before.current.isConnected) {
          before.current.focus({ preventScroll: true });
        }
      }}
    />
  );
};

PromptHost.displayName = 'PromptHost';

export { PromptHost };
