import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { ChevronDown as ChevronDownIcon } from '@keyline-icons/react';
import {
  BookOpen as BookOpenIcon,
  ClipboardList as ClipboardListIcon,
  Code as CodeIcon,
  Database as DatabaseIcon,
  GitBranch as GitBranchIcon,
  Globe as GlobeIcon,
  Home as HomeIcon,
  Language as LanguageIcon,
  Lock as LockIcon,
  Monitor as MonitorIcon,
  MusicNote as MusicNoteIcon,
  Palette as PaletteIcon,
  Server as ServerIcon,
  Smartphone as SmartphoneIcon,
  Tv as TvIcon,
} from '@keyline-icons/react/fill';
import { Badge } from '@ValenceUI/Badge';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { Link } from '@ValenceUI/Link';
import { cn } from '@ValenceUI/cn';
import { describeSince } from '@ValenceScreens/components/AdminArea/describeSince';
import { readReleaseNotes } from '@ValenceScreens/admin/readReleaseNotes';
import { say } from '@ValenceI18n/say';
import type { ReleaseSection } from '@ValenceScreens/admin/readReleaseNotes';
import type { IconGlyph } from '@ValenceUI/Icon.types';
import type { ReleaseEntryProps } from './ReleaseEntry.types';

const SCOPE_ICONS: Record<string, IconGlyph> = {
  auth: LockIcon,
  database: DatabaseIcon,
  desktop: MonitorIcon,
  docs: BookOpenIcon,
  i18n: LanguageIcon,
  landing: HomeIcon,
  mobile: SmartphoneIcon,
  music: MusicNoteIcon,
  repo: GitBranchIcon,
  requests: ClipboardListIcon,
  server: ServerIcon,
  tv: TvIcon,
  ui: PaletteIcon,
  web: GlobeIcon,
};

/**
 * The mark for the part of Valence a change is about, by the first part it names.
 *
 * @param scope - The parts, joined with commas.
 * @returns Its mark, or a generic one for a part without its own.
 */
const iconOfScope = (scope: string): IconGlyph =>
  SCOPE_ICONS[scope.split(',')[0]?.trim() ?? ''] ?? CodeIcon;

const SECTION_NAMES: Record<Exclude<ReleaseSection['kind'], 'written'>, string> = {
  added: say('common.added'),
  fixed: say('screens.adminArea.updatesPanel.releaseEntry.fixed'),
  other: say('screens.adminArea.updatesPanel.releaseEntry.otherChanges'),
};

/**
 * One release in the changelog: its number, whether this server runs it or it is newer, when it came
 * out, and, once opened, what changed in it and a way to read it on GitHub.
 *
 * @param release - The release.
 * @param isOpenAtFirst - Whether it starts open, as the newest does.
 * @param now - The time, for how long ago it came out.
 */
const ReleaseEntry = ({ release, isOpenAtFirst, now }: ReleaseEntryProps) => {
  const prefersReducedMotion = useReducedMotionConfig();
  const [isOpen, setIsOpen] = useState(isOpenAtFirst);
  const notes = release.notes === null ? [] : readReleaseNotes(release.notes);

  return (
    <li className="flex flex-col">
      <Button
        variant="row"
        size="none"
        aria-expanded={isOpen}
        label={
          isOpen
            ? say('screens.adminArea.updatesPanel.releaseEntry.hideWhatChangedInVersion', {
                version: release.version,
              })
            : say('screens.adminArea.updatesPanel.releaseEntry.showWhatChangedInVersion', {
                version: release.version,
              })
        }
        hasTooltip={false}
        className="items-center gap-2.5 px-2 py-2.5"
        onClick={() => {
          setIsOpen((was) => !was);
        }}
      >
        <Icon
          of={ChevronDownIcon}
          size={16}
          className={cn(
            'shrink-0 text-text-muted transition-transform duration-[var(--duration-fast)] ease-[var(--ease-out)] motion-reduce:transition-none',
            isOpen ? '' : '-rotate-90',
          )}
        />

        <span className="text-sm font-medium tabular-nums text-text">{release.version}</span>

        {release.isCurrent ? (
          <Badge size="sm" tone="quiet">
            {say('common.thisServer')}
          </Badge>
        ) : release.isNewer ? (
          <Badge size="sm" tone="warning">
            {say('screens.adminArea.updatesPanel.releaseEntry.newer')}
          </Badge>
        ) : null}

        {release.publishedAt === null ? null : (
          <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">
            {describeSince(release.publishedAt, now)}
          </span>
        )}
      </Button>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pt-1 pr-2 pb-4 pl-[2.125rem] max-sm:pl-0">
              {notes.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {say('screens.adminArea.updatesPanel.releaseEntry.noNotesForThisRelease')}
                </p>
              ) : (
                notes.map((section) => (
                  <section
                    key={section.kind === 'written' ? section.heading : section.kind}
                    className="flex flex-col gap-2"
                  >
                    {section.kind === 'written' && section.heading === '' ? null : (
                      <h3 className="text-[0.8125rem] font-medium text-text">
                        {section.kind === 'written' ? section.heading : SECTION_NAMES[section.kind]}
                      </h3>
                    )}

                    <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-text-muted marker:text-text-muted/60">
                      {section.points.map((point) => (
                        <li
                          key={`${point.scope ?? ''}${point.text}`}
                          className="leading-relaxed [overflow-wrap:anywhere]"
                        >
                          {point.scope === null ? null : (
                            <Badge
                              size="sm"
                              tone="quiet"
                              icon={iconOfScope(point.scope)}
                              className="mr-1.5 align-[0.0625rem]"
                            >
                              {point.scope}
                            </Badge>
                          )}

                          <span className="text-text">{point.text}</span>

                          {point.pull === null ? null : (
                            <Link
                              href={point.pull.url}
                              className="ml-1.5 text-xs tabular-nums text-text-muted"
                            >
                              {say('screens.adminArea.updatesPanel.releaseEntry.pullNumber', {
                                number: point.pull.number,
                              })}
                            </Link>
                          )}

                          {point.author === null ? null : (
                            <span className="ml-1.5 text-xs text-text-muted">
                              {say('screens.adminArea.updatesPanel.releaseEntry.byAuthor', {
                                name: point.author,
                              })}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))
              )}

              <Link href={release.url} className="self-start text-sm">
                {say('screens.adminArea.updatesPanel.readItOnGitHub')}
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </li>
  );
};

ReleaseEntry.displayName = 'ReleaseEntry';

export { ReleaseEntry };
