import { useId, useRef, useState } from 'react';
import { FIELD_SURFACE } from '@ValenceUI/tokens/FIELD_SURFACE';
import { X as XIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { TextField } from '@ValenceUI/TextField';
import { MENU } from '@ValenceUI/tokens/menu';
import { FIELD_TEXT } from '@ValenceUI/tokens/FIELD_TEXT';
import { cn } from '@ValenceUI/cn';
import { sameWord } from './sameWord';
import type { KeyboardEvent } from 'react';
import type { TagFieldProps } from './TagField.types';
import { say } from '@ValenceI18n/say';

const MOST_SUGGESTED = 8;

/**
 * A list of words, such as genres or tags, written one at a time: each is a chip that can be taken
 * away, and the field beneath suggests the words already in use as you type, with how often each
 * is, so a library keeps one spelling of a word rather than three. Enter or a comma adds what was
 * typed, a suggestion's own spelling winning over a close one, and Backspace in an empty field
 * takes the last word away. A chip is dragged to put the words in order, or moved with Alt and an
 * arrow, since the first genre is the one a card shows.
 *
 * @param label - What the words are.
 * @param values - The words, in order.
 * @param onValuesChange - Told the new words whenever one is added, taken away or moved.
 * @param suggestions - The words already in use, with how often each is.
 * @param placeholder - What the empty field says.
 * @param isLabelHidden - Whether the label is for screen readers only.
 * @param disabled - Whether the words can be changed.
 * @param className - Extra classes for the caller's own layout.
 */
const TagField = ({
  label,
  values,
  onValuesChange,
  suggestions = [],
  placeholder,
  isLabelHidden = false,
  disabled = false,
  className,
}: TagFieldProps) => {
  const [draft, setDraft] = useState('');
  const [isOpen, setOpen] = useState(false);
  const [at, setAt] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const listId = useId();
  const field = useRef<HTMLInputElement>(null);
  const taken = new Set(values.map(sameWord));
  const typed = sameWord(draft);
  const offered =
    typed === ''
      ? []
      : suggestions
          .filter((one) => !taken.has(sameWord(one.value)) && sameWord(one.value).includes(typed))
          .toSorted(
            (one, other) =>
              Number(!sameWord(other.value).startsWith(typed)) -
                Number(!sameWord(one.value).startsWith(typed)) ||
              (other.count ?? 0) - (one.count ?? 0),
          )
          .slice(0, MOST_SUGGESTED);

  /**
   * Adds words, each spelled as the library already spells it where it does.
   *
   * @param words - What was typed or chosen.
   */
  const add = (words: readonly string[]) => {
    const added = [...values];

    for (const word of words) {
      const trimmed = word.trim();
      const spelled =
        suggestions.find((one) => sameWord(one.value) === sameWord(trimmed))?.value ?? trimmed;

      if (spelled !== '' && !added.some((one) => sameWord(one) === sameWord(spelled))) {
        added.push(spelled);
      }
    }

    if (added.length !== values.length) {
      onValuesChange(added);
    }

    setDraft('');
    setAt(0);
  };

  /**
   * Moves a word to another place in the list, as the first genre is the one a card shows.
   *
   * @param from - Where it is.
   * @param to - Where it goes.
   */
  const moveWord = (from: number, to: number) => {
    const word = values[from];

    if (word === undefined || to < 0 || to >= values.length || from === to) {
      return;
    }

    const next = values.filter((_, index) => index !== from);

    next.splice(to, 0, word);
    onValuesChange(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      add([offered[at]?.value ?? draft]);
    } else if (event.key === 'Backspace' && draft === '' && values.length > 0) {
      onValuesChange(values.slice(0, -1));
    } else if (event.key === 'ArrowDown' && offered.length > 0) {
      event.preventDefault();
      setAt((current) => Math.min(current + 1, offered.length - 1));
    } else if (event.key === 'ArrowUp' && offered.length > 0) {
      event.preventDefault();
      setAt((current) => Math.max(current - 1, 0));
    } else if (event.key === 'Escape' && isOpen && offered.length > 0) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div data-slot="tag-field" className={cn('relative flex flex-col gap-2', className)}>
      {isLabelHidden ? null : (
        <span aria-hidden className={FIELD_TEXT.label}>
          {label}
        </span>
      )}

      <div
        className={cn(
          'flex min-h-8 flex-wrap items-center gap-1 px-[3px] py-[3px]',
          FIELD_SURFACE,
          'transition-[border-color,box-shadow] duration-[var(--duration-instant)] ease-[var(--ease-out)] motion-reduce:transition-none',
          'hover:border-[var(--surface-divider)] focus-within:focus-ring',
          disabled
            ? 'cursor-not-allowed bg-transparent text-text-muted shadow-none opacity-70'
            : '',
        )}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            field.current?.focus();
          }
        }}
      >
        {values.map((value, index) => (
          <span
            key={value}
            data-slot="tag"
            draggable={!disabled}
            className={cn(
              'flex',
              disabled ? '' : 'cursor-grab active:cursor-grabbing',
              dragging === index ? 'opacity-50' : '',
            )}
            onDragStart={(event) => {
              setDragging(index);
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', value);
            }}
            onDragOver={(event) => {
              if (dragging !== null) {
                event.preventDefault();
              }
            }}
            onDrop={(event) => {
              event.preventDefault();

              if (dragging !== null) {
                moveWord(dragging, index);
              }

              setDragging(null);
            }}
            onDragEnd={() => {
              setDragging(null);
            }}
            onKeyDown={(event) => {
              if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
                event.preventDefault();
                moveWord(index, index + (event.key === 'ArrowLeft' ? -1 : 1));
              }
            }}
          >
            <Button
              variant="glossy"
              size="xs"
              label={say('ui.appliedFilters.removeSaid', { said: value })}
              hasTooltip={false}
              disabled={disabled}
              onClick={() => {
                onValuesChange(values.filter((one) => one !== value));
              }}
            >
              {value}
              <Icon of={XIcon} size={13} />
            </Button>
          </span>
        ))}

        <TextField
          ref={field}
          label={label}
          isLabelHidden
          isInset
          value={draft}
          {...(placeholder === undefined || values.length > 0 ? {} : { placeholder })}
          disabled={disabled}
          autoComplete="off"
          className="min-w-24 flex-1"
          onValueChange={(next) => {
            const parts = next.split(',');

            if (parts.length > 1) {
              add(parts.slice(0, -1));
              setDraft(parts.at(-1) ?? '');
            } else {
              setDraft(next);
              setAt(0);
            }

            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setOpen(true);
          }}
          onBlur={() => {
            setOpen(false);
          }}
        />
      </div>

      {!isOpen || offered.length === 0 ? null : (
        <div
          id={listId}
          role="listbox"
          aria-label={say('ui.tagField.suggestions', { label })}
          className={cn(MENU.content, 'absolute inset-x-0 top-full mt-1')}
        >
          {offered.map((one, index) => (
            <Button
              key={one.value}
              variant="row"
              size="none"
              role="option"
              aria-selected={index === at}
              className={cn(MENU.item, index === at ? 'bg-[var(--surface-hover)]' : '')}
              onPointerDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                add([one.value]);
              }}
            >
              <span className={MENU.itemLabel}>{one.value}</span>
              {one.count === undefined ? null : (
                <span className={MENU.detail}>{one.count.toString()}</span>
              )}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

TagField.displayName = 'TagField';

export { TagField };
