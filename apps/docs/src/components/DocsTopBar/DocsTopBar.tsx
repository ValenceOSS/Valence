import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { motion, useReducedMotionConfig, useScroll, useTransform } from 'motion/react';
import { Menu as MenuIcon } from '@keyline-icons/react';
import { IconBrandDiscordFilled, IconBrandGithubFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { Drawer } from '@ValenceUI/Drawer';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { cn } from '@ValenceUI/cn';
import { DOC_PAGES } from '@ValenceDocs/content/DOC_PAGES';
import { DOC_SOURCES } from '@ValenceDocs/content/DOC_SOURCES';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import { DocsNav } from '@ValenceDocs/components/DocsNav/DocsNav';
import { DocsSearch } from '@ValenceDocs/components/DocsSearch/DocsSearch';

const GITHUB_URL = 'https://github.com/ValenceOSS/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

const SHRINK_OVER_PIXELS = 140;

/**
 * The bar across the top of every page, as the main site's: it rides bare over the opening card,
 * and as the page scrolls it draws a glass panel in behind itself and narrows into a pill. It holds
 * the way home, search, the way out to the code, and on a narrow screen the button that opens the
 * list of pages.
 */
const DocsTopBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isStill = useReducedMotionConfig() === true;
  const { scrollY } = useScroll();
  const progress = useTransform(scrollY, [0, SHRINK_OVER_PIXELS], [0, 1], { clamp: true });
  const maxWidth = useTransform(progress, [0, 1], ['80rem', '62rem']);
  const marginTop = useTransform(progress, [0, 1], ['0.375rem', '1.125rem']);
  const backdropRadius = useTransform(progress, [0, 1], ['0px', '1rem']);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-2 sm:px-6">
      <motion.div
        {...(isStill ? {} : { style: { maxWidth, marginTop } })}
        className={cn(
          'relative flex h-14 w-full items-center gap-4 px-3',
          isStill
            ? 'mt-1.5 max-w-7xl rounded-2xl border border-border/60 bg-surface/85 backdrop-blur-md'
            : '',
        )}
      >
        {isStill ? null : (
          <motion.span
            aria-hidden
            style={{ opacity: progress, borderRadius: backdropRadius }}
            className="pointer-events-none absolute inset-0 border border-border/60 bg-surface/85 shadow-[var(--shadow-overlay)] backdrop-blur-md"
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label="Open the list of pages"
          className="relative z-10 lg:hidden"
          onClick={() => {
            setIsMenuOpen(true);
          }}
        >
          <Icon of={MenuIcon} size={20} />
        </Button>

        <Link to="/" className="relative z-10 flex shrink-0 items-center gap-2.5">
          <Logo size={24} isSolid />
          <span className="text-base font-semibold tracking-tight text-text">Valence Docs</span>
        </Link>

        <div className="relative z-10 flex flex-1 justify-center">
          <DocsSearch pages={DOC_PAGES} sources={DOC_SOURCES} />
        </div>

        <div className="relative z-10 hidden items-center gap-2 sm:flex">
          <Button
            variant="secondary"
            size="sm"
            label="View the source on GitHub"
            className="inline-flex items-center gap-2"
            onClick={() => {
              window.open(GITHUB_URL, '_blank', 'noopener,noreferrer');
            }}
          >
            <IconBrandGithubFilled size={16} />
            <span>GitHub</span>
          </Button>

          <Button
            variant="discord"
            size="sm"
            label="Join the Discord"
            className="inline-flex items-center gap-2"
            onClick={() => {
              window.open(DISCORD_URL, '_blank', 'noopener,noreferrer');
            }}
          >
            <IconBrandDiscordFilled size={16} />
            <span>Discord</span>
          </Button>
        </div>

        <Drawer
          label="Documentation pages"
          isOpen={isMenuOpen}
          onClose={() => {
            setIsMenuOpen(false);
          }}
        >
          <DocsNav
            sections={NAVIGATION}
            onNavigate={() => {
              setIsMenuOpen(false);
            }}
          />
        </Drawer>
      </motion.div>
    </header>
  );
};

DocsTopBar.displayName = 'DocsTopBar';

export { DocsTopBar };
