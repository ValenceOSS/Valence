import { useId, useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { IconArrowUpRight, IconChevronDownFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { Link } from '@ValenceUI/Link';
import { cn } from '@ValenceUI/cn';
import { openSpring, stillTransition } from '@ValenceUI/animations/reveal';
import { describePermission } from '@ValenceLanding/content/plugins/describePermission';
import type { PluginDetailsProps } from './PluginDetails.types';

const QUIET_LINK =
  'inline-flex items-center gap-1 text-sm font-semibold text-text-muted no-underline hover:text-text';

/**
 * Everything about a plugin that most visitors can skip, folded away beneath its card: exactly
 * which sites it talks to and every permission in full, and where its source can be read. Kept
 * behind a disclosure so the card itself says what the plugin is at a glance, while nothing it
 * asks for is ever hidden from somebody who wants to check.
 *
 * @param plugin - The plugin's catalogue entry.
 */
const PluginDetails = ({ plugin }: PluginDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const prefersReducedMotion = useReducedMotionConfig();
  const transition = prefersReducedMotion === true ? stillTransition : openSpring;

  return (
    <div className="flex flex-col">
      <Button
        variant="subtle"
        size="sm"
        aria-expanded={isOpen}
        aria-controls={panelId}
        hasTooltip={false}
        className="-ml-1 gap-1.5 self-start px-1"
        onClick={() => {
          setIsOpen((was) => !was);
        }}
      >
        {isOpen ? 'Hide details' : 'Details'}
        <IconChevronDownFilled
          size={14}
          aria-hidden
          className={cn(
            'transition-transform duration-[var(--duration-fast)] motion-reduce:transition-none',
            isOpen ? 'rotate-180' : '',
          )}
        />
      </Button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            key="details"
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-3">
              {plugin.permissions.length === 0 ? (
                <p className="text-sm text-text-muted">Asks for no permissions.</p>
              ) : (
                <ul
                  aria-label={`Everything ${plugin.name} may do`}
                  className="flex flex-col gap-2 rounded-2xl border border-[var(--surface-line)] bg-[var(--surface-hover)] p-4"
                >
                  {plugin.permissions.map((permission) => (
                    <li key={permission.kind} className="text-sm leading-relaxed text-text-muted">
                      {describePermission(permission)}
                    </li>
                  ))}
                </ul>
              )}

              <Link href={plugin.sourceUrl} className={QUIET_LINK}>
                Read the source
                <IconArrowUpRight size={14} aria-hidden />
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

PluginDetails.displayName = 'PluginDetails';

export { PluginDetails };
