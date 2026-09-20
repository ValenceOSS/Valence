import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Checkbox } from '@ValenceUI/Checkbox';
import { Icon } from '@ValenceUI/Icon';
import { cn } from '@ValenceUI/cn';
import { CODEC_NAMES } from '@ValenceCore/functions/renditionLabel';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { FileGroupProps } from './FileGroup.types';

/**
 * How large a file is, or that nobody recorded it.
 *
 * @param sizeBytes - What the library recorded, where it did.
 * @returns The size in words.
 */
const describeSize = (sizeBytes: number | null | undefined): string =>
  typeof sizeBytes === 'number' && sizeBytes > 0 ? formatBytes(sizeBytes) : 'size not recorded';

/**
 * What one file inside a thing is called: the episode by its number where it has one, the cut by
 * what the cut is, and otherwise its own name.
 *
 * @param item - The file.
 * @returns What to call it within its group.
 */
const withinGroup = (item: MediaSummary): string => {
  if (item.seasonNumber !== null && item.episodeNumber !== null) {
    return `S${String(item.seasonNumber)}E${String(item.episodeNumber)} · ${item.title}`;
  }

  return item.versionLabel ?? item.title;
};

/**
 * The facts about a file that decide whether re-encoding it is worth anything.
 *
 * @param item - The file.
 * @param refusal - Why it would be turned away, where it would.
 * @returns The line beneath its name.
 */
const factsOf = (item: MediaSummary, refusal: string | null): string =>
  [
    `${item.width.toString()}×${item.height.toString()}`,
    CODEC_NAMES[item.videoCodec] ?? item.videoCodec,
    describeSize(item.sizeBytes),
    ...(refusal === null ? [] : [refusal]),
  ].join(' · ');

/**
 * One thing an operator might re-encode, and the files it is made of.
 *
 * A programme with forty episodes, or a film with a theatrical cut and a director's, is one
 * decision far more often than it is forty. So the thing is the row: ticking it takes everything
 * under it, and what it costs is the total of all of them, which is the figure somebody is weighing.
 * The files are underneath for the times that is not what was meant.
 *
 * A thing made of one file is drawn as a plain row with no fold, because a fold over a single
 * episode is a control that does nothing.
 *
 * @param group - The thing and its files, with what they cost together.
 * @param chosen - Which files are ticked, across every group.
 * @param refusalFor - Why a file would be turned away, where it would.
 * @param onToggle - Called with the files to tick or untick together.
 */
const FileGroup = ({ group, chosen, refusalFor, onToggle }: FileGroupProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [isOpen, setIsOpen] = useState(false);

  const only = group.items.length === 1 ? group.items[0] : undefined;
  const takenCount = group.items.filter((one) => chosen.has(one.id)).length;

  if (only !== undefined) {
    return (
      <li className="rounded-md px-2 py-1.5 hover:bg-shade/20">
        <Checkbox
          label={group.title}
          description={factsOf(only, refusalFor(only.id))}
          checked={chosen.has(only.id)}
          onCheckedChange={(next) => {
            onToggle([only], next);
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-md">
      <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-shade/20">
        <Button
          variant="subtle"
          size="none"
          aria-expanded={isOpen}
          label={`${isOpen ? 'Hide' : 'Show'} what ${group.title} is made of`}
          isIconOnly
          hasTooltip={false}
          className="flex size-6 shrink-0 items-center justify-center"
          onClick={() => {
            setIsOpen((was) => !was);
          }}
        >
          <Icon
            of={ChevronDownIcon}
            size={16}
            className={cn(
              'transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none',
              isOpen ? '' : '-rotate-90',
            )}
          />
        </Button>

        <Checkbox
          label={group.title}
          description={`${group.items.length.toString()} files · ${describeSize(group.sizeBytes)}`}
          checked={takenCount === group.items.length}
          isMixed={takenCount > 0 && takenCount < group.items.length}
          onCheckedChange={(next) => {
            onToggle(group.items, next);
          }}
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.ul
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            className="overflow-hidden pl-8"
          >
            {group.items.map((item) => (
              <li key={item.id} className="rounded-md px-2 py-1.5 hover:bg-shade/20">
                <Checkbox
                  label={withinGroup(item)}
                  description={factsOf(item, refusalFor(item.id))}
                  checked={chosen.has(item.id)}
                  onCheckedChange={(next) => {
                    onToggle([item], next);
                  }}
                />
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </li>
  );
};

FileGroup.displayName = 'FileGroup';

export { FileGroup };
