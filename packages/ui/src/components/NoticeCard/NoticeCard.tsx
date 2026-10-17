import { useEffect, useRef, useState } from 'react';
import { Info as InfoIcon, TriangleAlert as WarningIcon, X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { StatusRing } from '@ValenceUI/StatusRing';
import { cn } from '@ValenceUI/cn';
import type { NoticeCardProps, NoticeTone } from './NoticeCard.types';
import { say } from '@ValenceI18n/say';
import { sayCount } from '@ValenceI18n/sayCount';

const SECOND_MS = 1000;

/**
 * The mark at the start of a notice: the same round status mark the spinner draws, for work that
 * is under way, done or failed, so a notice that follows a spinner carries on from it, and the icon
 * set's own for news and warnings.
 *
 * @param tone - What kind of notice it is.
 * @returns The mark.
 */
const markOf = (tone: NoticeTone) => {
  switch (tone) {
    case 'worked':
      return <StatusRing status="done" size={20} />;
    case 'working':
      return <StatusRing status="running" size={20} />;
    case 'failed':
      return <StatusRing status="failed" size={20} />;
    case 'warning':
      return <Icon of={WarningIcon} size={18} className="text-highlight" />;
    case 'info':
      return <Icon of={InfoIcon} size={18} tone="muted" />;
  }
};

/**
 * One thing the application has to say, as a card drawn like every other: its mark, what happened
 * and a line more, any short tags worth reading at a glance, and a quiet way to dismiss it in the
 * corner. Where there is something to do about it, or it will act on its own, a footer in the frame
 * beneath holds the action and the count down to then, tinted with the danger colour where what
 * happens then cannot be undone. Solid whatever is behind it, since it floats over the page with
 * nothing dimming it.
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
  const [isPaused, setIsPaused] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const isDanger = tone === 'failed';
  const seconds = countdown?.seconds;

  useEffect(() => {
    setLeft(seconds ?? 0);
  }, [seconds, tone]);

  useEffect(() => {
    const stack = shell.current?.closest('[data-sonner-toaster]') ?? shell.current;

    if (countdown === undefined || stack === null) {
      return undefined;
    }

    const pause = () => {
      setIsPaused(true);
    };
    const resume = () => {
      setIsPaused(false);
    };
    const follow = () => {
      setIsPaused(document.hidden);
    };

    stack.addEventListener('pointerenter', pause);
    stack.addEventListener('pointerleave', resume);
    document.addEventListener('visibilitychange', follow);

    return () => {
      stack.removeEventListener('pointerenter', pause);
      stack.removeEventListener('pointerleave', resume);
      document.removeEventListener('visibilitychange', follow);
    };
  }, [countdown]);

  useEffect(() => {
    if (countdown === undefined || isPaused) {
      return undefined;
    }

    const ticking = setInterval(() => {
      setLeft((was) => Math.max(0, was - 1));
    }, SECOND_MS);

    return () => {
      clearInterval(ticking);
    };
  }, [countdown, isPaused]);

  const hasFooter = countdown !== undefined || action !== undefined;

  return (
    <div
      ref={shell}
      className={cn(
        'flex w-[min(26rem,calc(100vw-2rem))] flex-col rounded-2xl border p-1',
        'border-[var(--menu-line)] bg-[var(--frame-card)] shadow-[var(--shadow-overlay)]',
        '[background-image:linear-gradient(var(--frame-card),var(--frame-card))] [background-color:var(--color-surface)]',
        isDanger && 'border-danger/30',
      )}
    >
      <div className="valence-card-face flex items-start gap-3 py-3 pr-2 pl-3.5 text-text">
        <span className="flex h-5 shrink-0 items-center">{markOf(tone)}</span>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-px">
          <p className="text-sm font-medium leading-5 [overflow-wrap:anywhere]">{title}</p>

          {description === undefined ? null : (
            <p className="text-[0.8125rem] leading-snug text-text-muted [overflow-wrap:anywhere]">
              {description}
            </p>
          )}

          {tags === undefined || tags.length === 0 ? null : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[var(--surface-hover)] px-2 py-0.5 text-xs text-text"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="subtle"
          size="xs"
          isIconOnly
          label={say('common.dismiss')}
          onClick={onDismiss}
          className="-mt-0.5 shrink-0"
        >
          <Icon of={XIcon} size={14} />
        </Button>
      </div>

      {hasFooter ? (
        <div className="flex min-h-10 items-center justify-between gap-3 pr-1 pl-3 text-[0.8125rem]">
          {countdown === undefined ? (
            <span />
          ) : (
            <p className="text-text-muted">
              {countdown.lead ?? say('ui.noticeCard.thisWillCloseIn')}{' '}
              <span className={cn('tabular-nums', isDanger ? 'text-danger' : 'text-text')}>
                {sayCount('common.count.seconds', left)}
              </span>
            </p>
          )}

          {action === undefined ? null : (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                action.onPress();
                onDismiss();
              }}
            >
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
};

NoticeCard.displayName = 'NoticeCard';

export { NoticeCard };
