import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Menu as MenuIcon } from '@keyline-icons/react';
import { IconBrandDiscordFilled, IconBrandGithubFilled } from '@tabler/icons-react';
import { Button } from '@ValenceUI/Button';
import { Drawer } from '@ValenceUI/Drawer';
import { Icon } from '@ValenceUI/Icon';
import { Logo } from '@ValenceUI/Logo';
import { DOC_PAGES } from '@ValenceDocs/content/DOC_PAGES';
import { DOC_SOURCES } from '@ValenceDocs/content/DOC_SOURCES';
import { NAVIGATION } from '@ValenceDocs/content/NAVIGATION';
import { DocsNav } from '@ValenceDocs/components/DocsNav/DocsNav';
import { DocsSearch } from '@ValenceDocs/components/DocsSearch/DocsSearch';

const GITHUB_URL = 'https://github.com/ValenceOSS/Valence';

const DISCORD_URL = 'https://discord.gg/uTtcAHMy9N';

/**
 * The bar across the top of every page: the way home, search, the way out to the code, and on a
 * narrow screen the button that opens the list of pages.
 */
const DocsTopBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-surface/85 px-4 backdrop-blur-md">
      <Button
        variant="ghost"
        size="sm"
        isIconOnly
        label="Open the list of pages"
        className="lg:hidden"
        onClick={() => {
          setIsMenuOpen(true);
        }}
      >
        <Icon of={MenuIcon} size={20} />
      </Button>

      <Link to="/" className="flex shrink-0 items-center gap-2.5">
        <Logo size={24} isSolid />
        <span className="text-base font-semibold tracking-tight text-text">Valence Docs</span>
      </Link>

      <div className="flex flex-1 justify-center">
        <DocsSearch pages={DOC_PAGES} sources={DOC_SOURCES} />
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <Button
          variant="glossy"
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
    </header>
  );
};

DocsTopBar.displayName = 'DocsTopBar';

export { DocsTopBar };
