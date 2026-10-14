import { useEffect, useState } from 'react';
import {
  Info as InfoIcon,
  TriangleAlert as WarningIcon,
  X as CloseIcon,
} from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { StatusMark } from '@ValenceUI/StatusMark';
import { cn } from '@ValenceUI/cn';
import type { NoticeCardProps, NoticeTone } from './NoticeCard.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SECOND_MS = 1000;

/**
 * The mark at the start of a notice: the status mark for work that is under way, done or failed,
 * so a notice that follows a spinner carries on from it, and the icon set's own for news and
 * warnings.
 *
 * @param tone - What kind of notice it is.
 * @returns The mark.
 */
const markOf = (tone: NoticeTone) => {
  switch (tone) {
    case 'worked':
      return <StatusMark state="done" size={18} />;
    case 'working':
      return <StatusMark state="loading" size={18} />;
    case 'failed':
      return <StatusMark state="failed" size={18} />;
    case 'warning':
      return <Icon of={WarningIcon} size={17} className="text-highlight" />;
    case 'info':
      return <Icon of={InfoIcon} size={17} className="text-accent" />;
  }
};

/**
 * One thing the application has to say, as a card: its mark, what happened and a line more, the
 * one thing that can be done about it beside a way to dismiss it, any short tags worth reading at a
 * glance, and, where it is about to act on its own, a count down to when it will, set in a tray
 * beneath the card and tinted with the danger colour where what happens then cannot be undone.
 *
 * @param tone - What kind of notice it is.
 * @param title - What happened.
 * @param description - A line more.
 * @param action - The one thing to do about it, such as undoing it.
 * @param tags - Short facts worth reading at a glance.
 * @param countdown - How long until it acts on its own, and what it says beside the count.
 * @param onDismiss - Told to take it away.
 */
const NoticeCard = ({
  tone,
  title,
  description,
  action,
  tags,
  countdown,
  onDismiss,
}: NoticeCardProps) => {
  const [left, setLeft] = useState(countdown?.seconds ?? 0);
  const isDanger = tone === 'failed';

  useEffect(() => {
    if (countdown === undefined) {
      return undefined;
    }

    const ticking = setInterval(() => {
      setLeft((was) => Math.max(0, was - 1));
    }, SECOND_MS);

    return () => {
      clearInterval(ticking);
    };
  }, [countdown]);

  const card = (
    <div className="valence-card-face relative flex gap-3.5 p-4 pr-12 text-text">
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-[0.625rem] border',
          isDanger
            ? 'border-danger/20 bg-danger/10'
            : 'border-[var(--surface-line)] bg-[var(--surface-hover)]',
        )}
      >
        {markOf(tone)}
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-sans text-[0.9375rem] font-medium leading-snug">{title}</p>

        {description === undefined ? null : (
          <p className="font-body text-sm leading-snug text-text-muted">{description}</p>
        )}

        {tags === undefined || tags.length === 0 ? null : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[var(--surface-hover)] px-2 py-0.5 font-body text-xs text-text"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-4 font-body text-sm">
          <Button variant="link" size="none" onClick={onDismiss} className="text-text-muted">
            {say('common.dismiss')}
          </Button>

          {action === undefined ? null : (
            <Button
              variant="link"
              size="none"
              onClick={() => {
                action.onPress();
                onDismiss();
              }}
              className="font-medium text-text"
            >
              {action.label}
            </Button>
          )}
        </div>
      </div>

      <span className="absolute top-3 right-3">
        <Button
          variant="subtle"
          size="sm"
          isIconOnly
          label={say('common.dismiss')}
          onClick={onDismiss}
        >
          <Icon of={CloseIcon} size={16} />
        </Button>
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        'valence-card-shell flex w-[min(26rem,calc(100vw-2rem))] flex-col shadow-[var(--shadow-overlay)]',
        isDanger && 'border-danger/30',
      )}
    >
      {card}

      {countdown === undefined ? null : (
        <p className="px-3 pt-2 pb-1.5 text-center font-body text-sm text-text-muted">
          {countdown.lead ?? say('ui.noticeCard.thisWillCloseIn')}{' '}
          <span className={cn('tabular-nums', isDanger ? 'text-danger' : 'text-text')}>
            {sayCount('common.count.seconds', left)}
          </span>
        </p>
      )}
    </div>
  );
};

NoticeCard.displayName = 'NoticeCard';

export { NoticeCard };
