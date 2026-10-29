import { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotionConfig } from 'motion/react';
import { Moon as MoonIcon, Sun as SunIcon } from '@keyline-icons/react';
import { Button } from '@ValenceUI/Button';
import { Icon } from '@ValenceUI/Icon';
import { say } from '@ValenceI18n/say';
import { keepSiteTheme } from './keepSiteTheme';
import { readSiteTheme } from './readSiteTheme';
import { useSiteTheme } from './useSiteTheme';
import type { ThemeToggleProps } from './ThemeToggle.types';

/**
 * Switches the whole site between light and dark from the bar: a sun while it is dark, to go light,
 * and a moon while it is light, to go dark. Once on the page it sets the visitor's own choice, or
 * their system's if they never made one, and the sun and moon turn over one another as it changes.
 * A page drawn on a server follows the system until then, so the page it hydrates matches.
 *
 * @param className - Extra classes for the caller's own layout.
 */
const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const theme = useSiteTheme();
  const isStill = useReducedMotionConfig() === true;
  const next = theme === 'dark' ? 'light' : 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', readSiteTheme());
  }, []);

  return (
    <Button
      variant="secondary"
      size="sm"
      isIconOnly
      label={say(next === 'light' ? 'ui.siteNav.switchToLightMode' : 'ui.siteNav.switchToDarkMode')}
      {...(className === undefined ? {} : { className })}
      onClick={() => {
        keepSiteTheme(next);
        document.documentElement.setAttribute('data-theme', next);
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          className="flex"
          initial={isStill ? false : { rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={isStill ? { opacity: 0 } : { rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 22 }}
        >
          <Icon of={theme === 'dark' ? SunIcon : MoonIcon} size={16} />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
};

ThemeToggle.displayName = 'ThemeToggle';

export { ThemeToggle };
